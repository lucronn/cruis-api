export const MOCK_VEHICLE_NAME = {
    body: "2015 BMW 328i xDrive Sedan"
};

export const MOCK_ARTICLES = {
    body: {
        articleDetails: [
            {
                id: "mock-article-1",
                title: "Brake Pad Replacement",
                subtitle: "Front Brakes",
                bucket: "Brakes",
                parentBucket: "Labor"
            },
            {
                id: "mock-tsb-1",
                title: "Technical Service Bulletin 12345",
                subtitle: "Engine Control Module",
                bucket: "Technical Service Bulletins",
                parentBucket: "TSB"
            }
        ],
        filterTabs: []
    }
};

export const MOCK_ARTICLE_HTML = {
    html: `
        <h1>Brake Pad Replacement</h1>
        <p>This is a guide to replacing brake pads.</p>
        <p>Step 1: Remove the wheel.</p>
        <img src="https://via.placeholder.com/800x600" alt="Wheel removal">
        <p>Step 2: Remove the caliper.</p>
        <div style="display:block; width:500px;">
            <img src="https://via.placeholder.com/800x600/ff0000" alt="Caliper removal">
        </div>
        <p>Step 3: Install new pads.</p>
    `
};

// A simple 1-page PDF base64
export const MOCK_PDF_ARTICLE = {
    pdf: "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXwKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSC4gIC9SZXNvdXJjZXMgPDwKICAgIC9Gb250IDw8CiAgICAgIC9FMSA0IDAgUgogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNSAwIG9iago8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9FMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDE1NyAwMDAwMCBuIAowMDAwMDAwMjU1IDAwMDAwIG4gCjAwMDAwMDAzNDMgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDM3CiUlRU9GCg==",
    documentId: "mock-tsb-12345"
};
