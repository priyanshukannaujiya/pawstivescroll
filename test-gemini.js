import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyDUP_WWDjNsdhTAInZPQ_HsEqnpPrQNvJU";
const genAI = new GoogleGenerativeAI(API_KEY);

async function test() {
    console.log("Testing gemini-2.0-flash with new key...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Say hello in one word.");
        console.log("✅ SUCCESS:", result.response.text());
    } catch (e) {
        console.error("❌ FAILED:", e.message);

        // Try gemini-flash-latest as backup
        try {
            console.log("\nTrying gemini-flash-latest...");
            const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
            const result = await model.generateContent("Say hello in one word.");
            console.log("✅ SUCCESS with gemini-flash-latest:", result.response.text());
        } catch (e2) {
            console.error("❌ FAILED:", e2.message);
        }
    }
}

test();
