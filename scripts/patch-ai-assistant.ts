import { readFileSync, writeFileSync } from "fs";
const path = "src/pages/AIAssistant.tsx";
let content = readFileSync(path, "utf8");

// 1. Add useEffect import
content = content.replace(
  'useState,\n    useRef',
  'useState,\n    useRef,\n    useEffect'
);

// 2. Insert AI status state + useEffect after setError declaration
const oldBlock = `const [error,setError] =

useState("");`;

const newBlock = `const [error,setError] =


useState("");


const [aiStatus,setAiStatus] = useState<{status:string,provider:string,message:string}>({
    status:"checking",
    provider:"unknown",
    message:"Checking AI status"
});


useEffect(()=>{
    const token = localStorage.getItem("token");
    const fetchStatus = async () => {
        try {
            const res = await fetch(\`\${API_URL}/ai/gemini-status\`, {
                headers: token ? { Authorization: \`Bearer \${token}\` } : {}
            });
            const data = await res.json();
            if (data && data.status) {
                setAiStatus({
                    status: data.status,
                    provider: data.provider || "unknown",
                    message: data.message || ""
                });
            }
        } catch {
            setAiStatus({ status: "fallback", provider: "rule-based", message: "Using rule-based fallback" });
        }
    };
    fetchStatus();
}, []);`;

if (!content.includes(oldBlock)) {
  console.log("OLD BLOCK NOT FOUND");
  process.exit(1);
}
content = content.replace(oldBlock, newBlock);

// 3. Replace hardcoded "AI Online" with dynamic state
// Match across whitespace
const aiOnlineRegex = new RegExp(String.raw`AI\s+Online`);
content = content.replace(aiOnlineRegex, '{aiStatus.status === "available" ? "AI Online" : aiStatus.status === "degraded" ? "AI Degraded" : aiStatus.status === "fallback" ? "AI Fallback" : "AI Checking"}');

// 4. Replace hardcoded "Gemini Engine" with dynamic provider
const geminiRegex = new RegExp(String.raw`Gemini\s+Engine`);
content = content.replace(geminiRegex, '{aiStatus.provider === "gemini" ? "Gemini Engine" : aiStatus.provider === "openai" ? "OpenAI Engine" : aiStatus.provider === "rule-based" ? "Rule Engine" : "AI Engine"}');

// 5. Replace "Web + WhatsApp Automation Ready" footer to be more honest
content = content.replace('Web + WhatsApp Automation Ready', 'Configuration-dependent external services');

writeFileSync(path, content);
console.log("DONE");
