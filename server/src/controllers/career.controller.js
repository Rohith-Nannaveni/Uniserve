const User = require("../models/User");
const createError = require("../utils/createError");
const axios = require("axios");
const pdf = require("pdf-parse");

const analyzeResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(createError(404, "User not found!"));

    // Only Premium and Business users can use this
    if (user.subscription === "normal") {
      return next(createError(403, "Upgrade to Premium or Business to use Resume AI!"));
    }

    const { resumeUrl, jobDescription, targetRole, experienceLevel } = req.body;
    if (!resumeUrl) return next(createError(400, "Resume URL is required!"));

    // 1. Fetch the PDF content
    const response = await axios.get(resumeUrl, { responseType: "arraybuffer" });
    
    // 2. Parse PDF
    const data = await pdf(Buffer.from(response.data));
    const resumeText = data.text;

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    let targetedContext = "";
    if (jobDescription) {
      targetedContext += `Target Job Description: "${jobDescription}". Compare the resume against this specific JD. Identify missing keywords and specific technical/soft skills required by this employer.\n`;
    }
    if (targetRole && experienceLevel) {
      targetedContext += `Target Role: "${targetRole}" at "${experienceLevel}" level. What are the industry-standard competencies for this specific role and level that this user is currently missing?\n`;
    }

    const prompt = `
      Analyze the following resume text and provide a comprehensive assessment.
      
      ${targetedContext}

      Resume Text:
      ${resumeText}

      Return the response ONLY as a JSON object in the exact following format:
      {
        "atsScore": number (0-100),
        "tips": ["General formatting/structure tip 1", "Tip 2", ...],
        "parsedSkills": ["Detected skill 1", "Skill 2", ...],
        "gapAnalysis": {
          "missingSkills": ["Specific skill to learn 1", "Skill 2", ...],
          "focusAreas": ["Specific project or area to concentrate on 1", "Area 2", ...],
          "roleFitScore": number (0-100 score of how well they match the targeted Role/JD, default to 0 if no target provided)
        }
      }
    `;

    let aiResponseText = "";

    // 1. Try Gemini Primary (using confirmed gemini-2.5-flash)
    try {
      console.log("Attempting Gemini AI (Primary: gemini-2.5-flash)...");
      const geminiRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        { 
          contents: [{ parts: [{ text: prompt }] }] 
        }
      );
      
      if (geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        aiResponseText = geminiRes.data.candidates[0].content.parts[0].text;
        console.log("Gemini 2.5 Success!");
      } else {
        throw new Error("Empty response structure from Gemini 2.5");
      }
    } catch (geminiErr) {
      console.error("Gemini (gemini-2.5-flash) Failed, trying gemini-flash-latest...", geminiErr.message);
      
      try {
        const geminiFlashLatestRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
          { 
            contents: [{ parts: [{ text: prompt }] }] 
          }
        );
        aiResponseText = geminiFlashLatestRes.data.candidates[0].content.parts[0].text;
        console.log("Gemini-Flash-Latest Success!");
      } catch (geminiFlashLatestErr) {
        console.error("Gemini Fallbacks Failed, attempting OpenAI Fallback...", geminiFlashLatestErr.message);
        
        // 2. Fallback to OpenAI
        if (OPENAI_API_KEY) {
          try {
            const openAIRes = await axios.post(
              "https://api.openai.com/v1/chat/completions",
              {
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
              },
              {
                headers: { 
                  "Authorization": `Bearer ${OPENAI_API_KEY}`,
                  "Content-Type": "application/json"
                },
              }
            );
            aiResponseText = openAIRes.data.choices[0].message.content;
            console.log("OpenAI Fallback Success!");
          } catch (openAiErr) {
            console.error("OpenAI Fallback failed (likely 429 quota):", openAiErr.message);
            return next(createError(500, "All AI services failed. Gemini (404/403) and OpenAI (429/Quota)."));
          }
        } else {
          return next(createError(500, "Gemini failed and no OpenAI key provided for fallback."));
        }
      }
    }

    // Process Response
    const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return next(createError(500, "Failed to parse AI response."));
    
    const analysis = JSON.parse(jsonMatch[0]);

    // Save to User Model
    user.resumeData = {
      url: resumeUrl,
      atsScore: analysis.atsScore,
      tips: analysis.tips,
      parsedSkills: analysis.parsedSkills,
      gapAnalysis: analysis.gapAnalysis || {
        missingSkills: [],
        focusAreas: [],
        roleFitScore: 0
      }
    };
    await user.save();

    res.status(200).json(user.resumeData);
  } catch (err) {
    next(err);
  }
};

const getResumeData = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(createError(404, "User not found!"));
    
    // Ensure gapAnalysis exists for older profiles
    const resumeData = user.resumeData ? {
      ...user.resumeData.toObject(),
      gapAnalysis: user.resumeData.gapAnalysis || { missingSkills: [], focusAreas: [], roleFitScore: 0 }
    } : null;
    
    res.status(200).json(resumeData);
  } catch (err) {
    next(err);
  }
};

const togglePlacementReady = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(createError(404, "User not found!"));

    if (user.subscription !== "business") {
      return next(createError(403, "Placement support is only for Business (Pro) users!"));
    }

    user.isPlacementReady = !user.isPlacementReady;
    await user.save();

    res.status(200).send({ isPlacementReady: user.isPlacementReady });
  } catch (err) {
    next(err);
  }
};

const submitVerification = async (req, res, next) => {
    try {
        const { type, proofs, university, graduationYear } = req.body; // type: 'premium' or 'business'
        const user = await User.findById(req.userId);
        
        user.subscription = type;
        if (type === 'premium') {
            user.studentVerification.collegeId = proofs.collegeId;
            user.studentVerification.status = 'pending';
        } else if (type === 'business') {
            user.studentVerification.collegeId = proofs.collegeId;
            user.studentVerification.transcripts = proofs.transcripts;
            user.studentVerification.status = 'pending';
        }
        
        user.university = university;
        user.graduationYear = graduationYear;

        await user.save();
        res.status(200).send("Verification documents submitted successfully.");
    } catch (err) {
        next(err);
    }
};

const respondToPoRemoval = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(createError(404, "User not found!"));

    if (!user.poRemovalNotification?.isActive) {
      return next(createError(400, "No active removal notification found."));
    }

    const { action, message } = req.body; // action: "accept" | "request_readd"

    if (action === "accept") {
      // Student accepts the removal — notification dismissed
      user.poRemovalNotification.isActive = false;
      user.poRemovalNotification.studentResponse = "accepted";
    } else if (action === "request_readd") {
      // Student requests to be re-added — PO will see this in their requests panel
      user.poRemovalNotification.studentResponse = "requested_readd";
      user.poRemovalNotification.readdRequestMessage = message || "";
      // Keep isActive true so the student can see their pending request status
    } else {
      return next(createError(400, "Invalid action. Use 'accept' or 'request_readd'."));
    }

    await user.save();
    res.status(200).json({
      message: action === "accept"
        ? "You have accepted the removal. Best of luck!"
        : "Your re-addition request has been sent to your Placement Officer.",
      updatedNotification: user.poRemovalNotification
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { analyzeResume, getResumeData, togglePlacementReady, submitVerification, respondToPoRemoval };
