import { GoogleGenAI, Type } from "@google/genai";

// Removed createRequire and related readline logic as it's for CLI, not a server.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
const language = "Mandarin";

// No longer need readline, util, rl, or question for a web server.

export async function getReport({personality, age, lifePath, isMaster, karmicDebtOrigin, birthday, challenges, personalYear, gender}) {
        let opening = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
            thinkingConfig: {
                includeThoughts: true,
                thinkingBudget: -1, // Dynamic thinking budget, at most 32726 tokens
            },
            httpOptions: {
                timeout: 180*1000 // 180 seconds timeout
            },
            maxOutputTokens: 40000,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        //reportTitle: { type: Type.STRING, description: "An evocative and empowering title for the report, e.g., 'A Guide to Nurturing Your Little Powerhouse'." },
                        chapter1_innerTeam: {
                            type: Type.OBJECT,
                            properties: {
                                //title: { type: Type.STRING },
                                polygonChart: {
                                    type: Type.OBJECT,
                                    description: "The complete polygon chart data for the 'Personality Blueprint'.",
                                    properties: {
                                        //title: { type: Type.STRING, description: "e.g., 'Your Child's Personality Blueprint'" },
                                        LeadershipAndIndependence: { type: Type.NUMBER, description: "Score for Leadership & Independence (1-10)" },
                                        EmpathyAndConnection: { type: Type.NUMBER, description: "Score for Empathy & Connection (1-10)" },
                                        CreativityAndExpression: { type: Type.NUMBER, description: "Score for Creativity & Expression (1-10)" },
                                        AnalyticalAndStrategicMind: { type: Type.NUMBER, description: "Score for Analytical & Strategic Mind (1-10)" },
                                        DiligenceAndReliability: { type: Type.NUMBER, description: "Score for Diligence & Reliability (1-10)" },
                                        AdventurousAndAdaptableSpirit: { type: Type.NUMBER, description: "Score for Adventurous & Adaptable Spirit (1-10)" }
                                    },
                                    required: ["LeadershipAndIndependence", "EmpathyAndConnection", "CreativityAndExpression", "AnalyticalAndStrategicMind", "DiligenceAndReliability", "AdventurousAndAdaptableSpirit"],
                                    propertyOrdering: ["LeadershipAndIndependence", "EmpathyAndConnection", "CreativityAndExpression", "AnalyticalAndStrategicMind", "DiligenceAndReliability", "AdventurousAndAdaptableSpirit"]
                                },
                                introduction: { type: Type.STRING, description: "A brief, compassionate introduction to the concept of the child's 'inner team' of archetypes." },
                                teamCaptain: {
                                    type: Type.OBJECT,
                                    properties: {
                                        archetype: { type: Type.STRING, description: "The name of the core archetype based on the lifePath.number (e.g., 'The Little Sage', 'The Powerhouse')" },
                                        description: { type: Type.STRING, description: "A detailed paragraph describing the core traits and motivations of the Team Captain archetype." },
                                        whatItLooksLike: { type: Type.STRING, description: "A paragraph of concrete, observable behaviors parents might see in their child that reflect this archetype." },
                                        theWhyBehindIt: { type: Type.STRING, description: "A paragraph explaining the underlying psychological or numerological reason for the archetype's behavior." }
                                    },
                                    required: ["archetype", "description", "whatItLooksLike", "theWhyBehindIt"],
                                    propertyOrdering: ["archetype", "description", "whatItLooksLike", "theWhyBehindIt"]
                                },
                                supportingCast: {
                                    type: Type.ARRAY,
                                    minItems: 2,
                                    maxItems: 2,
                                    description: "Two supporting archetypes derived from the birthday number and challenges.main.",
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            archetype: { type: Type.STRING,description: "The name of the supporting archetype (e.g., 'The Nurturer', 'The Innovator')" },
                                            description: { type: Type.STRING, description: "A brief description of the supporting archetype's traits and how they complement the Team Captain." },
                                            sourceNumber: { type: Type.STRING, description: "A string explaining where this archetype is derived from, e.g., 'from their Birthday Number 11'." }
                                        },
                                        required: ["archetype", "description", "sourceNumber"],
                                        propertyOrdering: ["archetype", "description", "sourceNumber"]
                                    }
                                },
                                coreDynamic: { type: Type.STRING, description: "A paragraph explaining the interplay between the Team Captain and the supporting cast, including potential conflicts and synergies." },
                                reflectionQuestions: {
                                    type: Type.ARRAY,
                                    minItems: 3,
                                    maxItems: 3,
                                    description: "An array of 3 thought-provoking questions for the parent to reflect on regarding their child's inner team.",
                                    items: { type: Type.STRING }
                                },  
                                },
                            required: ["polygonChart", "introduction", "teamCaptain", "supportingCast", "coreDynamic", "reflectionQuestions"],
                            propertyOrdering: ["polygonChart", "introduction", "teamCaptain", "supportingCast", "coreDynamic", "reflectionQuestions"]
                            },
                        chapter2_innerWorld: {
                            type: Type.OBJECT,
                            properties: {
                                //title: { type: Type.STRING },
                                greatestStrength: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING, description: "A unique name for the child's greatest strength, derived from a combination of lifePath.number and birthday number (e.g., 'Practical Intuition')" },
                                        description: { type: Type.STRING, description: "A detailed paragraph explaining this strength, how it manifests in the child's behavior, and why it is significant." }
                                    },
                                    required: ["name", "description"],
                                    propertyOrdering: ["name", "description"]
                                },
                                coreChallenge: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING, description: "A clear name for the child's main life lesson (e.g., 'Building True Self-Confidence')." },
                                        description: { type: Type.STRING, description: "A compassionate explanation of the core challenge, using challenges.main." }
                                    },
                                    required: ["name", "description"],
                                    propertyOrdering: ["name", "description"]
                                },
                                hiddenFear: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING, description: "A name for the child's hidden fear, inferred from the shadow side of their lifePath.number (e.g., 'Fear of Powerlessness')." },
                                        description: { type: Type.STRING, description: "A paragraph explaining this fear, how it might manifest in the child's behavior, and why it is important for the parent to understand." }
                                    },
                                    required: ["name", "description"],
                                    propertyOrdering: ["name", "description"]
                                },
                                reflectionQuestions: {
                                    type: Type.ARRAY,
                                    minItems: 3,
                                    maxItems: 3,
                                    description: "An array of 3 thought-provoking questions for the parent to reflect on regarding their child's inner world.",
                                    items: { type: Type.STRING }
                                }
                            },
                            required: ["greatestStrength", "coreChallenge", "hiddenFear", "reflectionQuestions"],
                            propertyOrdering: ["greatestStrength", "coreChallenge", "hiddenFear", "reflectionQuestions"]
                        },
                        chapter3_parentsPlaybook: {
                            type: Type.OBJECT,
                            properties: {
                                //title: { type: Type.STRING },
                                introduction: { type: Type.STRING, description: "A brief introduction explaining that this chapter provides actionable strategies." },
                                parentingMindset:{
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING, description: "A descriptive name for the parent's core role, derived from the Life Path (e.g., 'The Empowering Coach' for a LP 1, 'The Nurturing Anchor' for a LP 6)." },
                                        description: { type: Type.STRING, description: "A paragraph explaining the mindset, how it relates to the child's attributes and why it is important." }
                                    },
                                    required: ["name", "description"],
                                    propertyOrdering: ["name", "description"]
                                },
                                learningEnvironmentAndStyle:{
                                    type: Type.OBJECT,
                                    properties: {
                                        //title: { type: Type.STRING, description: "e.g., 'Unlocking Their Potential'" },
                                        environmentKeys: {
                                            type: Type.OBJECT,
                                            properties: {
                                                name: { type: Type.STRING, description: "A descriptive name for the recommended learning environment (e.g., 'The Creative Studio')" },
                                                points: {
                                                    type: Type.ARRAY,
                                                    minItems: 4,
                                                    maxItems: 4,
                                                    description: "An array of 4 bullet points on setting up the child's physical and emotional space, derived from their Life Path and Birthday numbers. Provide atleast 3 specific and actionable examples.",
                                                    items: { type: Type.STRING }
                                                }
                                            },
                                            required: ["name", "points"],
                                            propertyOrdering: ["name", "points"]
                                        },
                                        communicationKeys_Potential: {
                                            type: Type.ARRAY,
                                            minItems: 4,
                                            maxItems: 4,
                                            description: "Provide an array of 4 communication strategies to foster curiosity and build on the child's strengths.",
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    insteadOf: { type: Type.STRING, description: "A common phrase a parent might say."},
                                                    tryThis: { type: Type.STRING, description: "A more effective and empowering alternative phrase that leverages the child's strength and personality." },
                                                    whyItWorks: { type: Type.STRING, description: "The psychological reason the alternative phrase is more effective." }
                                                },
                                                required: ["insteadOf", "tryThis", "whyItWorks"],
                                                propertyOrdering: ["insteadOf", "tryThis", "whyItWorks"]
                                            }
                                        }
                                    },
                                    required: ["environmentKeys", "communicationKeys_Potential"],
                                    propertyOrdering: ["environmentKeys", "communicationKeys_Potential"]
                                },
                                guidanceCommunicationAndBoundaries: {
                                    type: Type.OBJECT,
                                    properties: {
                                        disciplineAndBoundaries:  { type: Type.STRING, description: "A paragraph explaining the approach to discipline, based on the child's 'main' and 'current' Challenge Numbers. Provide atleast 3 specific and actionable examples." },
                                        //title: { type: Type.STRING, description: "e.g., 'Guidance for Growth: Discipline & Boundaries'" },
                                        communicationKeys_Boundaries: {
                                            type: Type.ARRAY,
                                            minItems: 4,
                                            maxItems: 4,
                                            description: "Provide an array of 4 communication strategies for setting firm, compassionate boundaries, addressing challenges and handling difficult behavior.",
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    insteadOf: { type: Type.STRING, description: "A common phrase a parent might say."},
                                                    tryThis: { type: Type.STRING, description: "A more effective and empowering alternative phrase that addresses the child's coreChallenge, hiddenFear and potential weakness from Life Path." },
                                                    whyItWorks: { type: Type.STRING, description: "The psychological reason the alternative phrase is more effective." }
                                                },
                                                required: ["insteadOf", "tryThis", "whyItWorks"],
                                                propertyOrdering: ["insteadOf", "tryThis", "whyItWorks"]
                                            }
                                        }
                                    },

                                    required: ["disciplineAndBoundaries", "communicationKeys_Boundaries"],
                                    propertyOrdering: ["disciplineAndBoundaries", "communicationKeys_Boundaries"]

                                },
                                friendshipAndCurrentFocus: {
                                    type: Type.OBJECT,
                                    properties: {
                                        //title: { type: Type.STRING, description: "e.g., 'Social Style & Current Focus'" },
                                        socialAndFriendshipStyle: { type: Type.STRING, description: "A paragraph explaining the child's social tendencies based on their core archetype, with nuance added from challenges.current.number. Include how they might be learning to navigate social situations right now. Provide atleast 2 specific and actionable advice on how parents can help them." },
                                        navigatingTheYearAhead: { type: Type.STRING, description: "Specific guidance based on the child's 'personalYear' number. This makes the report immediately relevant and timely. Include atleast 2 example activities for the child." }
                                        //title: { type: Type.STRING, description: "e.g., 'Focus for This Year'" },                                            },
                                    },
                                    required: ["socialAndFriendshipStyle", "navigatingTheYearAhead"],
                                    propertyOrdering: ["socialAndFriendshipStyle", "navigatingTheYearAhead"]
                                },

                                karmicLessonFocus: {
                                    type: Type.OBJECT,
                                    nullable: true,
                                    description: "A special section that ONLY appears if 'karmicDebtOrigin' is present. It provides targeted advice for that specific lesson.",
                                    properties: {
                                        title: { type: Type.STRING, nullable: true, description: "e.g., 'A Special Focus: The Lesson of...'" },
                                        description: { type: Type.STRING, nullable: true, description: "A compassionate and practical guide for helping the child navigate their specific Karmic Debt lesson (13, 14, 16, or 19)." }
                                    },
                                    required: ["title", "description"],
                                    propertyOrdering: ["title", "description"]
                                },

                                reflectionQuestions: {
                                    type: Type.ARRAY,
                                    minItems: 3,
                                    maxItems: 3,
                                    description: "An array of 3 thought-provoking questions for the parent to reflect on regarding their communication style, the child's social style and education style.",
                                    items: { type: Type.STRING }
                                }
                            },
                            required: ["introduction", "parentingMindset", "learningEnvironmentAndStyle", "guidanceCommunicationAndBoundaries", "friendshipAndCurrentFocus", "karmicLessonFocus",    "reflectionQuestions"],
                            propertyOrdering: ["introduction", "parentingMindset", "learningEnvironmentAndStyle", "guidanceCommunicationAndBoundaries", "friendshipAndCurrentFocus", "karmicLessonFocus", "reflectionQuestions"]
                        },
                        chapter4_ignitingPassions: {
                            type: Type.OBJECT,
                            properties: {
                                //title: { type: Type.STRING },
                                recommendedHobbies: {
                                    type: Type.ARRAY,
                                    minItems: 3,
                                    maxItems: 3,
                                    description: "An array of 3 different tiers of recommended hobbies, activities, or interests that align with the child's Life Path and Birthday numbers.",
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            tier: { type: Type.STRING, description: "The tier of the recommendation, e.g., 'Tier 1' for primary hobbies." },
                                            theme: { type: Type.STRING, description: "A brief theme or focus for the hobbies, e.g., 'Creative Expression'." },
                                            items: {
                                                type: Type.ARRAY,
                                                minItems: 5,
                                                maxItems: 5,
                                                description: "An array of 5 recommended specific hobbies, activities, or interests that align with the child's Life Path and Birthday numbers. E.g., 'Drawing', 'Nature Exploration', 'Music Appreciation'.",
                                                items: { type: Type.STRING }
                                            }
                                        },
                                        required: ["tier", "theme", "items"],
                                        propertyOrdering: ["tier", "theme", "items"]
                                    }
                                },
                                recommendedCareers: {
                                    type: Type.ARRAY,
                                    minItems: 3,
                                    maxItems: 3,
                                    description: "An array of 3 different tiers of recommended career paths that align with the child's Life Path and Birthday numbers.",
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            tier: { type: Type.STRING, description: "The tier of the recommendation, e.g., 'Tier 1' for primary career paths." },
                                            items: {
                                                type: Type.ARRAY,
                                                minItems: 5,
                                                maxItems: 5,
                                                description: "An array of 5 recommended specific career paths for the future. E.g., 'Creative Director', 'Environmental Scientist', 'Community Organizer'.",
                                                items: { type: Type.STRING }
                                            }
                                        },
                                        required: ["tier", "items"],
                                        propertyOrdering: ["tier", "items"]
                                    }
                                },
                                reflectionQuestions: {
                                    type: Type.ARRAY,
                                    minItems: 2,
                                    maxItems: 2,
                                    description: "An array of 2 thought-provoking questions for the parent to reflect on regarding their child's passions and future aspirations.",
                                    items: { type: Type.STRING }
                                }
                            },
                            required: ["recommendedHobbies", "recommendedCareers", "reflectionQuestions"],
                            propertyOrdering: ["recommendedHobbies", "recommendedCareers", "reflectionQuestions"]
                        },
                        conclusion: { type: Type.STRING, description: "A final, uplifting paragraph summarizing the child's potential and the parent's role as a guide. It should be compassionate and empowering, leaving the parent with a sense of hope and purpose." },
                    },
                    required: ["chapter1_innerTeam", "chapter2_innerWorld", "chapter3_parentsPlaybook", "chapter4_ignitingPassions", "conclusion"],
                    propertyOrdering: ["chapter1_innerTeam", "chapter2_innerWorld", "chapter3_parentsPlaybook", "chapter4_ignitingPassions", "conclusion"]
                }
            },
            
            systemInstruction: ` 
1. #ROLE & GOAL#
You are an expert in developmental psychology and Pythagorean numerology, with a talent for translating complex symbolic data into practical, logical, and empowering advice for parents. Your goal is to generate a comprehensive parenting guide based on a child's numerology data. The report MUST NOT be predictive or fortune-telling. It must be a logical, compassionate, and actionable tool that helps a parent understand their child's innate personality, challenges, and talents, and provides concrete strategies for education and guidance.

2. #TONE & PRINCIPLES#

* **Age-Appropriate Context is CRITICAL**: All examples, scenarios, and advice provided in the report MUST be tailored to be age-appropriate. The expression of a 'Powerhouse' at age 6 (playground politics) is different from age 16 (school projects, part-time jobs). Explicitly mention the age context where relevant.
* **Gender Context Guidance:** Use the provided gender to select appropriate pronouns (e.g., 他/她). The core analysis, advice, and recommendations MUST remain gender-neutral as numerological archetypes are universal. AVOID gender stereotypes in activities, careers, and personality descriptions. You may use the gender to inform culturally relevant, non-stereotypical examples of how an archetype might be expressed.

When recommending activities in 'chapter4_ignitingPassions', ensure you provide a **diverse list** of options that align with the child's core numerological energies to give the parent a broad range of ideas.

Empowering, Not Fatalistic: Focus on potential, lessons, and guidance. Avoid absolute statements about the future.

Practical & Logical: Provide concrete examples and explain the "why" behind behaviors. The karmicDebtOrigin is a tool for logical explanation, not for discussing past lives.

Compassionate & Supportive: The tone should feel like a wise and caring coach speaking to a parent.

Language": MUST Use ${language} for all text, ensuring it is culturally appropriate and resonates with the target audience.

Output Token: Maximum 2500 tokens for the entire report.

3. #CHART GENERATION#

//Chart Generation with Multi-Factor Scoring
You will generate data for a 6-axis "Core Energies Polygon" chart. You must derive a score (1-10) for each axis by synthesizing ALL relevant numerological data. Use the following weighted logic:
- The "lifePath.number" is the **primary driver** of the score (~60% weight).
- The "birthdayNumber" is a **significant secondary influence** (~30% weight).
- "challenges.main", "isMaster", and "karmicDebtOrigin" act as **final modifiers** (~10% total), either amplifying or softening the score based on their nature. For example, a Master number would amplify the 'Empathy & Connection' axis, while a Karmic Debt 14 might slightly lower the 'Adventurous & Adaptable Spirit' score due to the lesson of moderation.

**The Six Axes:**
- **Leadership & Independence:** (High LP 1, BD 1, LP 8)
- **Empathy & Connection:** (High LP 2, LP 6, BD 2, BD 6, isMaster=true)
- **Creativity & Expression:** (High LP 3, BD 3, LP 5)
- **Analytical & Strategic Mind:** (High LP 7, BD 7, LP 4)
- **Diligence & Reliability:** (High LP 4, LP 8, BD 4, BD 8, KD 13)
- **Adventurous & Adaptable Spirit:** (High LP 5, BD 5, LP 3, KD 14)

4. #COHERENCE & INTEGRATION#
The entire report must be internally consistent.
- The descriptions in 'chapter1_innerTeam' (especially the 'teamCaptain' and 'supportingCast') MUST align with the scores generated in the 'polygonChart'.
- The 'greatestStrength' and 'hiddenFear' in 'chapter2_innerWorld' MUST be logical extensions of the 'lifePath.number' and the polygon chart scores.
- The advice in 'chapter3_parentsPlaybook' MUST directly address the archetypes, strengths, and challenges defined in the previous chapters.
`
        },
        contents: {
            text: `You will utilize the numerology data given below containing all the necessary calculated numbers and information about the parent's child to generate the report:

{
    "mainPersonalityNumber": ${personality},

    "lifePath": {
      "number": ${lifePath},
      "isMaster": ${isMaster}, // true or false
      "karmicDebtOrigin": ${karmicDebtOrigin} // null or a number like 13, 14, 16, 19
    },

    "birthdayNumber": ${birthday},
    "challengesNumber": {
      "main": ${challenges.main}, // e.g., 1, 2, 3, etc.
      "current": {
        "number": ${challenges.current.number}, // e.g., 1, 2, 3, etc.
        "period": ${challenges.current.period} // "first" or "second"
      }
    },
    "personalYear": ${personalYear},
}
    
Moreover, the parent's child is ${age} year old and is ${gender}. Tailor your output based on this information.`
        }

    }); 
    console.log(`thinking token: ${opening.usageMetadata.thoughtsTokenCount} tokens`);
    console.log(`output token: ${opening.usageMetadata.candidatesTokenCount} tokens`);
    console.log(`input token: ${opening.usageMetadata.promptTokenCount} tokens`);
    console.log(`total token: ${opening.usageMetadata.totalTokenCount} tokens`);
    let cost = 0;
    if (opening.usageMetadata && typeof opening.usageMetadata.thoughtsTokenCount === 'number' && typeof opening.usageMetadata.candidatesTokenCount === 'number' && typeof opening.usageMetadata.promptTokenCount === 'number') {
        cost = (opening.usageMetadata.thoughtsTokenCount + opening.usageMetadata.candidatesTokenCount) * (10.00 * 4.50 / 1000000) + opening.usageMetadata.promptTokenCount * (1.25 * 4.50 / 1000000);
    }
    console.log(`cost: ${cost} MYR`);

    // Print thought summaries if available
    for (const part of opening.candidates[0].content.parts) {
    if (!part.text) {
      continue;
    }
    else if (part.thought) {
      console.log("Thoughts summary:");
      console.log(part.text);
    }
}
    return opening.text; // This is showed to user, it is the opening message to start the report generation
}


export class NumerologyCalculator {
    /**
     * Reduces a number to a single digit, unless it's a Master Number (11, 22).
     * This is the standard Pythagorean reduction method.
     * @param {number} num - The number to reduce.
     * @returns {number} The reduced single-digit number or a Master Number.
     */
    reduceNumber(num) {
        // Master numbers 11 and 22 are not reduced further in most cases.
        if (num === 11 || num === 22) {
            return num;
        }
        let sum = num;
        // Loop until the number is a single digit.
        while (sum > 9) {
            sum = String(sum).split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
            // Check for Master Numbers that appear during the reduction process.
            if (sum === 11 || sum === 22) {
                return sum;
            }
        }
        return sum;
    }

    /**
     * A simple reduction rule that does not preserve Master Numbers.
     * Used for specific calculations like Challenge Numbers.
     * @param {number} num - The number to reduce.
     * @returns {number} The single-digit number.
     */
    forceReduceToSingleDigit(num) {
        let sum = num;
        while (sum > 9) {
            sum = String(sum).split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
        }
        return sum;
    }

    /**
     * The original addition rule from your code, kept for legacy calculations.
     * @param {number} n1
     * @param {number} n2
     * @returns {number}
     */
    addRule(n1, n2) {
        const sum = n1 + n2;
        if (sum > 9 && sum !== 11 && sum !== 22) { // Modified to not reduce master numbers here
            const s = String(sum);
            const reducedSum = parseInt(s[0], 10) + parseInt(s[1], 10);
            return reducedSum;
        }
        return sum;
    }
    
    /**
     * Converts a number to its corresponding Wu Xing element.
     * @param {number} num - The number to convert.
     * @returns {string} The Wu Xing element.
     */
    wuxing(num) {
        const mapping = {
            1: '水', 2: '土', 3: '木', 4: '木', 5: '土',
            6: '金', 7: '金', 8: '土', 9: '火'
        };
        return mapping[this.forceReduceToSingleDigit(num)] || '未知';
    }

    /**
     * Main function to start the calculation process.
     * REMOVED: This will no longer prompt for input. It will take the date as an argument.
     */
    calculate(birthday, gender = null) { // Changed to accept birthday string and optional gender
        if (birthday && birthday.length === 10) {
            const bdinfo = birthday.split('-');
            const [yearStr, monthStr, dayStr] = bdinfo;

            if (yearStr.length === 4 && monthStr.length === 2 && dayStr.length === 2 && parseInt(monthStr, 10) <= 12 && parseInt(dayStr, 10) <= 31) {
                const results = this.processNumbers(yearStr, monthStr, dayStr, gender);
                return results; // Return the results for further processing
            } else {
                throw new Error('日期格式不正确，请确保为 YYYY-MM-DD 格式且日期有效。');
            }
        } else {
            throw new Error('输入格式不正确，请输入10位日期，例如：2018-01-02');
        }
    }

    /**
     * Processes all numerology calculations and returns a structured object.
     * @param {string} yearStr
     * @param {string} monthStr
     * @param {string} dayStr
     * @param {string} gender - Optional gender parameter
     * @returns {object} A structured object containing all calculated numbers.
     */
    processNumbers(yearStr, monthStr, dayStr, gender = null) {
        // --- Legacy Number Calculations (as per original logic) ---
        const A = parseInt(dayStr[0], 10);
        const B = parseInt(dayStr[1], 10);
        const C = parseInt(monthStr[0], 10);
        const D = parseInt(monthStr[1], 10);
        const E = parseInt(yearStr[0], 10);
        const F = parseInt(yearStr[1], 10);
        const G = parseInt(yearStr[2], 10);
        const H = parseInt(yearStr[3], 10);

        const I = this.addRule(A, B);
        const J = this.addRule(C, D);
        const K = this.addRule(E, F);
        const L = this.addRule(G, H);
        const M = this.addRule(I, J);
        const N = this.addRule(K, L);
        const O = this.addRule(M, N); // Main Personality Number
        const P = this.addRule(M, O);
        const Q = this.addRule(N, O);
        const R = this.addRule(Q, P);
        const X = this.addRule(I, M);
        const W = this.addRule(J, M);
        const S = this.addRule(X, W);
        const V = this.addRule(K, N);
        const U = this.addRule(L, N);
        const T = this.addRule(V, U);

        // --- Standard Pythagorean Calculations ---
        const monthVal = parseInt(monthStr, 10);
        const dayVal = parseInt(dayStr, 10);
        const yearVal = parseInt(yearStr, 10);
        const currentYear = 2025; // Target year for calculations

        // 1. Birthday Number ( innate talent)
        const birthdayNumber = this.reduceNumber(dayVal);

        // 2. Life Path Number (with Karmic Debt and Master Number detection)
        const reducedMonth = this.reduceNumber(monthVal);
        const reducedDay = this.reduceNumber(dayVal);
        const reducedYear = this.reduceNumber(String(yearVal).split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0));
        
        const lifePathSum = reducedMonth + reducedDay + reducedYear;
        const lifePathNumber = this.reduceNumber(lifePathSum);
        
        let karmicDebtOrigin = null;
        if ([13, 14, 16, 19].includes(lifePathSum)) {
            karmicDebtOrigin = lifePathSum;
        }

        // 3. Challenge Numbers
        const challengeMonth = this.forceReduceToSingleDigit(reducedMonth); 
        const challengeDay = this.forceReduceToSingleDigit(reducedDay);
        const challengeYear = this.forceReduceToSingleDigit(reducedYear);

        const challenge1 = Math.abs(challengeMonth - challengeDay);
        const challenge2 = Math.abs(challengeDay - challengeYear);
        const mainChallenge = Math.abs(challenge1 - challenge2);
        
        const ageInTargetYear = currentYear - yearVal;
        const firstChallengeEndAge = 36 - this.forceReduceToSingleDigit(lifePathNumber);
        
        let currentChallenge = { number: null, period: 'main' };
        if (ageInTargetYear <= firstChallengeEndAge) {
            currentChallenge = { number: challenge1, period: 'first' };
        } else {
            currentChallenge = { number: challenge2, period: 'second' };
        }

        // 4. Personal Year Number
        const personalYearNumber = this.reduceNumber(reducedMonth + reducedDay + this.reduceNumber(currentYear));

        // --- Structure the final output ---
        const results = {

            age: currentYear - parseInt(yearStr, 10),

            mainPersonality: O,

            lifePath: {
                number: lifePathNumber,
                isMaster: [11, 22].includes(lifePathNumber),
                karmicDebtOrigin: karmicDebtOrigin
            },
            birthday: birthdayNumber,
            challenges: {
                main: mainChallenge,
                current: currentChallenge
            },
            personalYear: personalYearNumber,
            gender: gender
        };

        return results;
    }
}