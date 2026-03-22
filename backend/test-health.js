// Simple test to check if the backend is responding
const testHealth = async () => {
  try {
    console.log("Testing health endpoint...");
    const response = await fetch("http://localhost:3000/health");
    const data = await response.json();
    console.log("Health check response:", data);
    console.log("Status:", response.status);
  } catch (error) {
    console.error("Health check failed:", error.message);
  }
};

testHealth();
