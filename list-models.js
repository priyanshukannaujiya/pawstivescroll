const API_KEY = "AIzaSyDUP_WWDjNsdhTAInZPQ_HsEqnpPrQNvJU";

async function listModels() {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await response.json();
    if (data.models) {
        console.log("Available models that support generateContent:");
        data.models
            .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
            .forEach(m => console.log(m.name));
    } else {
        console.log("Error:", JSON.stringify(data, null, 2));
    }
}

listModels();
