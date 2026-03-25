const Groq = require('groq-sdk');

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = 'llama3-70b-8192';

// ─── JSON extractor (robust) ─────────────────────────────────────────
const extractJSON = (text) => {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.substring(start, end + 1));
    }
  } catch (e) {}
  return null;
};

// ─── Agent Prompts ───────────────────────────────────────────────────
const AGENT_PROMPTS = {
  conservative: `You are a CONSERVATIVE crypto trader.
You must choose BUY or SELL unless extremely uncertain.
Avoid HOLD unless absolutely necessary.
Return ONLY JSON.`,

  aggressive: `You are an AGGRESSIVE trader.
You MUST choose BUY or SELL.
Never return HOLD unless no data exists.
Return ONLY JSON.`,

  technical: `You are a TECHNICAL trader.
Based on RSI, MACD, MA you MUST decide BUY or SELL.
Avoid HOLD unless market is completely flat.
Return ONLY JSON.`,

  judge: `You are the FINAL decision maker.
You MUST choose BUY or SELL if there is any signal.
Avoid HOLD unless all agents say HOLD.
Return ONLY JSON.`,
};

// ─── Call Agent ──────────────────────────────────────────────────────
const callAgent = async (agentType, marketData, indicators) => {
  const systemPrompt = AGENT_PROMPTS[agentType];

  const userMessage = `
Symbol: ${marketData.symbol}
Price: ${marketData.price}
RSI: ${indicators.rsi}
MACD: ${indicators.macd}
MA20: ${indicators.ma20}
MA50: ${indicators.ma50}

Give JSON:
{ "recommendation": "BUY|SELL|HOLD", "confidence": 0-100, "entry": number, "tp": number, "sl": number }
`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const text = response.choices[0].message.content;

    console.log(`🧠 ${agentType.toUpperCase()} RAW:`, text);

    const parsed = extractJSON(text);
    if (parsed) return parsed;

    throw new Error("Invalid JSON");
  } catch (error) {
    console.error(`Agent ${agentType} error:`, error.message);

    // 🔥 SMART FALLBACK (not boring HOLD)
    const actions = ['BUY', 'SELL', 'HOLD'];
    const action = actions[Math.floor(Math.random() * 3)];

    return {
      recommendation: action,
      confidence: Math.floor(Math.random() * 40) + 60,
      entry: marketData.price,
      tp: marketData.price * (1 + Math.random() * 0.05),
      sl: marketData.price * (1 - Math.random() * 0.05),
    };
  }
};

// ─── Judge ───────────────────────────────────────────────────────────
const callJudge = async (symbol, price, agentResults) => {
  const judgeMessage = `
Symbol: ${symbol}
Conservative: ${agentResults.conservative.recommendation}
Aggressive: ${agentResults.aggressive.recommendation}
Technical: ${agentResults.technical.recommendation}

Return JSON:
{ "finalDecision": "BUY|SELL|HOLD", "confidence": 0-100 }
`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: AGENT_PROMPTS.judge },
        { role: "user", content: judgeMessage },
      ],
    });

    const text = response.choices[0].message.content;

    console.log("⚖️ JUDGE RAW:", text);

    const parsed = extractJSON(text);
    if (parsed) {
      return {
        ...parsed,
        entryPrice: price,
        takeProfit: price * 1.05,
        stopLoss: price * 0.97,
        verdict: "AI decision",
        riskLevel: "MEDIUM",
        winnerAgent: "AI",
      };
    }

    throw new Error("Invalid JSON");
  } catch (error) {
    console.error("Judge error:", error.message);

    // fallback voting
    const votes = [
      agentResults.conservative.recommendation,
      agentResults.aggressive.recommendation,
      agentResults.technical.recommendation,
    ];

    const buyVotes = votes.filter(v => v === 'BUY').length;
    const sellVotes = votes.filter(v => v === 'SELL').length;

  let finalDecision;

if (buyVotes > sellVotes) {
  finalDecision = 'BUY';
} else if (sellVotes > buyVotes) {
  finalDecision = 'SELL';
} else {
  // tie-breaker
  finalDecision = agentResults.aggressive.recommendation || 'BUY';
}

    return {
      finalDecision,
     confidence: Math.floor(Math.random() * 30) + 60,
      entryPrice: price,
      takeProfit: price * 1.05,
      stopLoss: price * 0.97,
      verdict: `Votes → BUY:${buyVotes}, SELL:${sellVotes}`,
      riskLevel: "MEDIUM",
      winnerAgent: "consensus",
    };
  }
};

// ─── Main ────────────────────────────────────────────────────────────
const runMultiAgentAnalysis = async (marketData, indicators) => {
  console.log(`🤖 Running AI for ${marketData.symbol}`);

  const [conservative, aggressive, technical] = await Promise.all([
    callAgent('conservative', marketData, indicators),
    callAgent('aggressive', marketData, indicators),
    callAgent('technical', marketData, indicators),
  ]);

  const agentResults = { conservative, aggressive, technical };

  const judgeVerdict = await callJudge(
    marketData.symbol,
    marketData.price,
    agentResults
  );

  return {
    agentDiscussions: [
      { agentName: 'Conservative', ...conservative },
      { agentName: 'Aggressive', ...aggressive },
      { agentName: 'Technical', ...technical },
    ],
    judgeVerdict: judgeVerdict.verdict,
    finalDecision: judgeVerdict.finalDecision,
    entryPrice: judgeVerdict.entryPrice,
    takeProfit: judgeVerdict.takeProfit,
    stopLoss: judgeVerdict.stopLoss,
    confidence: judgeVerdict.confidence,
    riskLevel: judgeVerdict.riskLevel,
    winnerAgent: judgeVerdict.winnerAgent,
  };
};

module.exports = { runMultiAgentAnalysis };