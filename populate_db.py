import asyncio
import aiohttp
import sqlite3
import logging
from tqdm.asyncio import tqdm
from urllib.parse import quote

# Configuration
BASE_URL = "https://motorproxy-erohrfg7qa-uc.a.run.app/api/motor-proxy/api"
DB_FILE = "vehicles.db"
CONCURRENT_REQUESTS = 10  # Limit concurrency to avoid overwhelming the server

# Logging setup
logging.basicConfig(
    filename='populate_db.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

async def fetch_json(session, url):
    """Fetch JSON from a URL with error handling."""
    try:
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                # Handle the API's specific response structure
                if 'body' in data:
                    return data['body']
                return data
            else:
                error_message = f"Failed to fetch {url}: Status {response.status}"
                try:
                    # Attempt to read response body for more details
                    response_text = await response.text()
                    error_message += f", Response: {response_text[:500]}" # Log first 500 chars
                except Exception as text_e:
                    logging.warning(f"Could not read response text for {url}: {text_e}")
                logging.error(error_message)
                return None
    except aiohttp.ClientError as e:
        logging.error(f"Client error fetching {url}: {e}", exc_info=True)
        return None
    except asyncio.TimeoutError:
        logging.error(f"Timeout fetching {url}")
        return None
    except Exception as e:
        logging.error(f"Unexpected exception fetching {url}: {e}", exc_info=True)
        return None

def init_db():
    """Initialize the SQLite database."""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    # Vehicles table (denormalized for easier querying, or normalized as requested)
    # We'll store the hierarchy: Year -> Make -> Model
    c.execute('''
        CREATE TABLE IF NOT EXISTS years (
            year INTEGER PRIMARY KEY,
            status TEXT DEFAULT 'pending' -- 'pending', 'completed'
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS makes (
            id INTEGER,
            name TEXT,
            year INTEGER,
            PRIMARY KEY (id, year)
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS models (
            id TEXT PRIMARY KEY, -- vehicleId
            name TEXT,
            year INTEGER,
            make_id INTEGER,
            make_name TEXT
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS engines (
            id TEXT PRIMARY KEY, -- vehicleId:engineId
            vehicle_id TEXT,
            name TEXT,
            FOREIGN KEY (vehicle_id) REFERENCES models(id)
        )
    ''')
    
    conn.commit()
    # Create indexes for performance
    c.execute('CREATE INDEX IF NOT EXISTS idx_years_status ON years(status)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_makes_year ON makes(year)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_models_year ON models(year)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_models_make_id ON models(make_id)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_engines_vehicle_id ON engines(vehicle_id)')
    conn.commit()
    return conn

async def process_year(session, year, conn, semaphore):
    """Process a single year: fetch makes, then models/engines."""
    
    # Check if year is already completed
    c = conn.cursor()
    c.execute("SELECT status FROM years WHERE year = ?", (year,))
    row = c.fetchone()
    if row and row[0] == 'completed':
        return f"Year {year} already completed."

    # Insert year if not exists
    c.execute("INSERT OR IGNORE INTO years (year, status) VALUES (?, 'pending')", (year,))
    conn.commit()

    # Fetch Makes
    url = f"{BASE_URL}/year/{year}/makes"
    async with semaphore:
        makes = await fetch_json(session, url)
    
    if not makes:
        logging.warning(f"No makes found for year {year}")
        return

    # Store Makes
    c.executemany(
        "INSERT OR REPLACE INTO makes (id, name, year) VALUES (?, ?, ?)",
        [(m['makeId'], m['makeName'], year) for m in makes]
    )
    conn.commit()

    # Process Makes (Fetch Models)
    # We create tasks for fetching models for all makes in this year
    tasks = []
    for make in makes:
        tasks.append(process_make(session, year, make, conn, semaphore))
    
    await asyncio.gather(*tasks)

    # Mark year as completed
    c.execute("UPDATE years SET status = 'completed' WHERE year = ?", (year,))
    conn.commit()

async def process_make(session, year, make, conn, semaphore):
    """Fetch models for a specific make and year."""
    make_name = make['makeName']
    make_id = make['makeId']
    
    # URL encode the make name
    encoded_make = quote(make_name)
    url = f"{BASE_URL}/year/{year}/make/{encoded_make}/models"
    
    async with semaphore:
        data = await fetch_json(session, url)
    
    if not data or 'models' not in data:
        return

    models = data['models']
    
    # Prepare data for batch insertion
    model_rows = []
    engine_rows = []
    
    for model in models:
        model_id = model['id']
        model_name = model['model']
        model_rows.append((model_id, model_name, year, make_id, make_name))
        
        if 'engines' in model:
            for engine in model['engines']:
                engine_rows.append((engine['id'], model_id, engine['name']))
    
    # Insert into DB (using a new cursor for thread safety if needed, though sqlite3 in python is tricky with threads, 
    # but here we are in async single thread usually. However, aiohttp runs in event loop. 
    # SQLite connections can be shared if check_same_thread=False, but better to execute sequentially per task or use a queue.
    # For simplicity in this script, we'll just execute directly as we are not using threads, just async.)
    
    try:
        c = conn.cursor()
        c.executemany(
            "INSERT OR REPLACE INTO models (id, name, year, make_id, make_name) VALUES (?, ?, ?, ?, ?)",
            model_rows
        )
        c.executemany(
            "INSERT OR REPLACE INTO engines (id, vehicle_id, name) VALUES (?, ?, ?)",
            engine_rows
        )
        conn.commit()
    except sqlite3.Error as e:
        logging.error(f"Database error for {year} {make_name}: {e}")

async def main():
    print("🚀 Starting Vehicle DB Population...")
    
    # Initialize DB
    conn = sqlite3.connect(DB_FILE, check_same_thread=False) # Needed for async access if we were threading, but good practice
    init_db()
    
    timeout = aiohttp.ClientTimeout(total=30)
    connector = aiohttp.TCPConnector(ssl=False)
    async with aiohttp.ClientSession(timeout=timeout, connector=connector, headers={"User-Agent": "VehicleDBPopulator/1.0"}) as session:
        # Fetch Years
        print("Fetching available years...")
        years_data = await fetch_json(session, f"{BASE_URL}/years")
        
        if not years_data:
            print("❌ Failed to fetch years. Exiting.")
            return

        years = sorted(years_data, reverse=True) # Process newest first
        print(f"Found {len(years)} years: {years[0]} - {years[-1]}")
        
        # Initialize years in DB
        c = conn.cursor()
        for year in years:
            c.execute("INSERT OR IGNORE INTO years (year, status) VALUES (?, 'pending')", (year,))
        conn.commit()

        # Semaphore to limit concurrency
        semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)
        
        # Process years with progress bar
        # We process years sequentially or in small batches to avoid too much context switching and memory usage
        # But we can parallelize makes within a year, or parallelize years.
        # Let's parallelize years with a limit.
        
        tasks = [process_year(session, year, conn, semaphore) for year in years]
        
        # Use tqdm to show progress
        for f in tqdm.as_completed(tasks, total=len(years), desc="Processing Years"):
            await f

    conn.close()
    print("\n✅ Database population complete! Saved to 'vehicles.db'")

if __name__ == "__main__":
    asyncio.run(main())
