// UNERA Unified Multilingual Internationalization (i18n) Engine
// Supports English, Hindi (हिन्दी), Marathi (मराठी), and Gujarati (ગુજરાતી)

export type LanguageCode = 'en' | 'hi' | 'mr' | 'gu';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', label: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' }
];

export const translations = {
  en: {
    // Brand & Tagline
    appName: 'UNERA',
    tagline: 'Your Notes. Smarter Learning.',
    versionBadge: 'v3.2 Enterprise',
    
    // Lamp Login Page
    pullCordPrompt: 'Pull cord to turn on lamp',
    pullCordToTurnOff: 'Pull cord again to turn off light',
    pullOrClickCord: 'Click or pull the switch to illuminate',
    loginWelcome: 'Welcome to UNERA',
    loginSubtitle: 'The Cost-Intelligent, Interruptible AI Learning OS',
    emailOrUser: 'Email or Student ID',
    emailPlaceholder: 'alex.rivera@campus.edu',
    password: 'Password',
    passwordPlaceholder: '••••••••',
    rememberMe: 'Remember for 30 days',
    forgotPassword: 'Forgot password?',
    signInBtn: 'Sign In to Learning OS',
    continueGuest: 'Enter as Guest Student →',
    demoRolesTitle: '⚡ One-Click Demo Access:',
    roleStudent: 'Student Alex',
    roleProf: 'Prof. Rao',
    roleEvaluator: 'Evaluator Demo',
    lightStatusOn: 'Light is ON — Room Illuminated',
    lightStatusOff: 'Light is OFF — Room in Dark Ambience',
    backTo3D: '🌀 3D Knowledge Core',
    enterWorkspaceDirect: '🚀 Enter Workspace Direct',

    // 3D Loading Screen & Book Opening
    loadingTitle: 'Opening Lecture Notes in 3D...',
    openingBook: 'Rapidly flipping pages into Login...',
    calibrating: 'Calibrating Subsystems...',
    calibrated100: 'Notes 100% Loaded — Launching Login Page',
    enterWorkspace: 'Enter UNERA Workspace →',
    proceedToLogin: '💡 Proceed to Lamp Login →',
    skipDirect: 'Skip directly to Login',
    viewSphere: 'Sphere Core',
    viewNeural: 'Neural Network',
    mouseTiltPrompt: 'Move mouse to tilt book in 3D perspective',

    // Top Navigation & Action Buttons
    home: 'Home',
    features: 'Features',
    howItWorks: 'How it works',
    demo: 'Demo',
    studyWorkspace: 'Study Workspace',
    openStudy: 'Open Study',
    uploadNotes: 'Upload notes',
    alarms: 'Alarms',
    alarmScheduler: 'Set Study Alarm',
    view3D: '3D View',
    login: 'Login',
    logout: 'Sign Out',
    lightMode: 'Light',
    darkMode: 'Dark',

    // Landing Page Hero
    heroHeadlinePart1: 'Learn from ',
    heroHeadlinePart2: 'your own notes.',
    heroSubtext: 'Upload your notes, ask questions with exact citations, set automated study alarms, and interrupt your AI tutor anytime by voice.',
    zeroSetup: '⚡ Zero setup required. Demo pre-loaded with Recursion & Call Stack notes.',
    
    // Workspace Controls
    evaluatorTour: 'Evaluator Demo Tour',
    costCaching: 'Cost & Caching',
    institutionHub: 'Institution Hub',
    compareSources: 'Compare Sources',
    conceptDNA: 'Concept DNA',
    tutorChat: 'AI Tutor Chat',
    askQuestionPlaceholder: 'Ask a question from your notes, or type your doubt...',
    send: 'Send',
    voiceSpeak: 'Speak',
    voiceStop: 'Stop Audio',
    startStudyingNow: '🚀 Start Studying This Now',
    snooze5Mins: '⏰ Snooze 5 Mins',
    dismiss: 'Dismiss',
    alarmRingingTitle: 'Study Alarm Triggered!'
  },

  hi: {
    // Brand & Tagline
    appName: 'UNERA',
    tagline: 'आपके नोट्स। बेहतर और स्मार्ट पढ़ाई।',
    versionBadge: 'v3.2 एंटरप्राइज',
    
    // Lamp Login Page
    pullCordPrompt: 'बत्ती जलाने के लिए डोरी खींचें',
    pullCordToTurnOff: 'बत्ती बुझाने के लिए दोबारा डोरी खींचें',
    pullOrClickCord: 'कमरे में रोशनी करने के लिए स्विच पर क्लिक करें या खींचें',
    loginWelcome: 'UNERA में आपका स्वागत है',
    loginSubtitle: 'लागत-कुशल, सहज वॉयस-इंटरप्टिबल AI लर्निंग प्लेटफॉर्म',
    emailOrUser: 'ईमेल या छात्र आईडी',
    emailPlaceholder: 'alex.rivera@campus.edu',
    password: 'पासवर्ड',
    passwordPlaceholder: '••••••••',
    rememberMe: '30 दिनों तक याद रखें',
    forgotPassword: 'पासवर्ड भूल गए?',
    signInBtn: 'लर्निंग OS में साइन इन करें',
    continueGuest: 'अतिथि छात्र के रूप में प्रवेश करें →',
    demoRolesTitle: '⚡ एक-क्लिक डेमो लॉगिन:',
    roleStudent: 'छात्र एलेक्स',
    roleProf: 'प्रो. राव',
    roleEvaluator: 'मूल्यांकनकर्ता डेमो',
    lightStatusOn: 'बत्ती चालू है — कमरा जगमगा उठा',
    lightStatusOff: 'बत्ती बंद है — शांत अंधेरा कमरा',
    backTo3D: '🌀 3D नॉलेज कोर',
    enterWorkspaceDirect: '🚀 सीधे वर्कस्पेस में जाएं',

    // 3D Loading Screen & Book Opening
    loadingTitle: '3D में नोट्स की किताब खुल रही है...',
    openingBook: 'पन्ने फटाफट पलट रहे हैं — लॉगिन पेज आ रहा है...',
    calibrating: 'उपप्रणालियों का अंशांकन जारी...',
    calibrated100: 'किताब पूरी तरह खुल गई — लॉगिन पेज शुरू हो रहा है',
    enterWorkspace: 'UNERA वर्कस्पेस खोलें →',
    proceedToLogin: '💡 लैंप लॉगिन पेज पर जाएं →',
    skipDirect: 'सीधे लॉगिन पेज पर जाएं',
    viewSphere: '3D स्फीयर कोर',
    viewNeural: 'न्यूरल नेटवर्क ग्राफ',
    mouseTiltPrompt: '3D परिप्रेक्ष्य में किताब को घुमाने के लिए माउस हिलाएं',

    // Top Navigation & Action Buttons
    home: 'होम',
    features: 'विशेषताएं',
    howItWorks: 'यह कैसे काम करता है',
    demo: 'डेमो',
    studyWorkspace: 'स्टडी वर्कस्पेस',
    openStudy: 'पढ़ाई शुरू करें',
    uploadNotes: 'नोट्स अपलोड करें',
    alarms: 'अलार्म',
    alarmScheduler: 'स्टडी अलार्म सेट करें',
    view3D: '3D दृश्य',
    login: 'लॉगिन',
    logout: 'साइन आउट',
    lightMode: 'लाइट',
    darkMode: 'डार्क',

    // Landing Page Hero
    heroHeadlinePart1: 'पढ़ाई करें ',
    heroHeadlinePart2: 'अपने खुद के नोट्स से।',
    heroSubtext: 'अपने नोट्स अपलोड करें, पृष्ठ-वार संदर्भों के साथ प्रश्न पूछें, स्वचालित स्टडी अलार्म सेट करें और अपने AI शिक्षक को कभी भी आवाज़ से टोकें।',
    zeroSetup: '⚡ कोई पूर्व सेटअप आवश्यक नहीं। रिकर्शन और कॉल स्टैक नोट्स पहले से लोड हैं।',
    
    // Workspace Controls
    evaluatorTour: 'डेमो टूर',
    costCaching: 'लागत और कैशिंग',
    institutionHub: 'संस्थान हब',
    compareSources: 'दस्तावेज़ तुलना',
    conceptDNA: 'कॉन्सेप्ट DNA',
    tutorChat: 'AI शिक्षक चैट',
    askQuestionPlaceholder: 'अपने नोट्स से प्रश्न पूछें, या अपना संदेह लिखें...',
    send: 'भेजें',
    voiceSpeak: 'बोलें',
    voiceStop: 'ऑडियो रोकें',
    startStudyingNow: '🚀 अभी पढ़ना शुरू करें',
    snooze5Mins: '⏰ 5 मिनट बाद याद दिलाएं',
    dismiss: 'हटाएं',
    alarmRingingTitle: 'स्टडी अलार्म बज रहा है!'
  },

  mr: {
    // Brand & Tagline
    appName: 'UNERA',
    tagline: 'तुमच्या स्वतःच्या नोट्स. अधिक स्मार्ट अभ्यास.',
    versionBadge: 'v3.2 एंटरप्राइझ',
    
    // Lamp Login Page
    pullCordPrompt: 'दिवा लावण्यासाठी दोरी ओढा',
    pullCordToTurnOff: 'दिवा विझवण्यासाठी पुन्हा दोरी ओढा',
    pullOrClickCord: 'खोलीत प्रकाश करण्यासाठी स्विचवर क्लिक करा किंवा ओढा',
    loginWelcome: 'UNERA मध्ये आपले स्वागत आहे',
    loginSubtitle: 'किफायतशीर, व्हॉईस-इंटरप्टिबल AI लर्निंग प्लॅटफॉर्म',
    emailOrUser: 'ईमेल किंवा विद्यार्थी आयडी',
    emailPlaceholder: 'alex.rivera@campus.edu',
    password: 'पासवर्ड',
    passwordPlaceholder: '••••••••',
    rememberMe: '30 दिवस लक्षात ठेवा',
    forgotPassword: 'पासवर्ड विसरलात?',
    signInBtn: 'लर्निंग OS मध्ये साइन इन करा',
    continueGuest: 'अतिथी विद्यार्थी म्हणून प्रवेश करा →',
    demoRolesTitle: '⚡ एका क्लिकवर डेमो प्रवेश:',
    roleStudent: 'विद्यार्थी अ‍ॅलेक्स',
    roleProf: 'प्रा. राव',
    roleEvaluator: 'परीक्षक डेमो',
    lightStatusOn: 'दिवा चालू आहे — खोली उजळली',
    lightStatusOff: 'दिवा बंद आहे — शांत काळोखी खोली',
    backTo3D: '🌀 3D नॉलेज कोर',
    enterWorkspaceDirect: '🚀 थेट वर्कस्पेस उघडा',

    // 3D Loading Screen & Book Opening
    loadingTitle: '3D मध्ये नोट्सचे पुस्तक उघडत आहे...',
    openingBook: 'पाने वेगाने उलटत आहेत — लॉगिन पृष्ठ येत आहे...',
    calibrating: 'प्रणाली कॅलिब्रेशन सुरू आहे...',
    calibrated100: 'पुस्तक पूर्णपणे उघडले — लॉगिन सुरू होत आहे',
    enterWorkspace: 'UNERA वर्कस्पेस उघडा →',
    proceedToLogin: '💡 लॅम्प लॉगिन पृष्ठावर जा →',
    skipDirect: 'थेट लॉगिन पृष्ठावर जा',
    viewSphere: '3D स्फिअर कोर',
    viewNeural: 'न्यूरल नेटवर्क आलेख',
    mouseTiltPrompt: '3D परिप्रेक्ष्यात पुस्तकाला फिरवण्यासाठी माउस हलवा',

    // Top Navigation & Action Buttons
    home: 'मुख्यपृष्ठ',
    features: 'वैशिष्ट्ये',
    howItWorks: 'हे कसे कार्य करते',
    demo: 'डेमो',
    studyWorkspace: 'स्टडी वर्कस्पेस',
    openStudy: 'अभ्यास सुरू करा',
    uploadNotes: 'नोट्स अपलोड करा',
    alarms: 'अलार्म',
    alarmScheduler: 'अभ्यास अलार्म लावा',
    view3D: '3D व्ह्यू',
    login: 'लॉगिन',
    logout: 'साइन आउट',
    lightMode: 'लाईट',
    darkMode: 'डार्क',

    // Landing Page Hero
    heroHeadlinePart1: 'अभ्यास करा ',
    heroHeadlinePart2: 'तुमच्या स्वतःच्या नोट्समधून.',
    heroSubtext: 'तुमच्या नोट्स अपलोड करा, अचूक पृष्ठांच्या संदर्भासह शंका विचारा, स्वयंचलित अभ्यास अलार्म लावा आणि AI शिक्षकाशी थेट आवाजात संवाद साधा.',
    zeroSetup: '⚡ कोणत्याही सेटअपची गरज नाही. रिकर्शन आणि कॉल स्टॅक नोट्स आधीच उपलब्ध आहेत.',
    
    // Workspace Controls
    evaluatorTour: 'डेमो टूर',
    costCaching: 'किंमत आणि कॅशिंग',
    institutionHub: 'संस्था हब',
    compareSources: 'दस्तऐवज तुलना',
    conceptDNA: 'संकल्पना DNA',
    tutorChat: 'AI शिक्षक चॅट',
    askQuestionPlaceholder: 'नोट्समधून प्रश्न विचारा, किंवा तुमची शंका लिहा...',
    send: 'पाठवा',
    voiceSpeak: 'बोला',
    voiceStop: 'ऑडिओ थांबवा',
    startStudyingNow: '🚀 आताच अभ्यास सुरू करा',
    snooze5Mins: '⏰ 5 मिनिटांनंतर आठवण करा',
    dismiss: 'बंद करा',
    alarmRingingTitle: 'अभ्यास अलार्म वाजत आहे!'
  },

  gu: {
    // Brand & Tagline
    appName: 'UNERA',
    tagline: 'તમારી પોતાની નોટ્સ. વધુ સ્માર્ટ શિક્ષણ.',
    versionBadge: 'v3.2 એન્ટરપ્રાઇઝ',
    
    // Lamp Login Page
    pullCordPrompt: 'દીવો ચાલુ કરવા માટે દોરી ખેંચો',
    pullCordToTurnOff: 'દીવો બંધ કરવા ફરી દોરી ખેંચો',
    pullOrClickCord: 'રૂમમાં પ્રકાશ કરવા માટે સ્વિચ ક્લિક કરો અથવા ખેંચો',
    loginWelcome: 'UNERA માં આપનું સ્વાગત છે',
    loginSubtitle: 'ખર્ચ-કાર્યક્ષમ, વૉઇસ-ઇન્ટરપ્ટિબલ AI લર્નિંગ પ્લેટફોર્મ',
    emailOrUser: 'ઈમેલ અથવા વિદ્યાર્થી ID',
    emailPlaceholder: 'alex.rivera@campus.edu',
    password: 'પાસવર્ડ',
    passwordPlaceholder: '••••••••',
    rememberMe: '30 દિવસ માટે યાદ રાખો',
    forgotPassword: 'પાસવર્ડ ભૂલી ગયા?',
    signInBtn: 'લર્નિંગ OS માં સાઇન ઇન કરો',
    continueGuest: 'અતિથિ વિદ્યાર્થી તરીકે પ્રવેશ કરો →',
    demoRolesTitle: '⚡ એક-ક્લિક ડેમો પ્રવેશ:',
    roleStudent: 'વિદ્યાર્થી એલેક્સ',
    roleProf: 'પ્રો. રાવ',
    roleEvaluator: 'મૂલ્યાંકનકર્તા ડેમો',
    lightStatusOn: 'દીવો ચાલુ છે — રૂમ પ્રકાશિત થયો',
    lightStatusOff: 'દીવો બંધ છે — શાંત અંધારો રૂમ',
    backTo3D: '🌀 3D નોલેજ કોર',
    enterWorkspaceDirect: '🚀 સીધા વર્કસ્પેસમાં જાઓ',

    // 3D Loading Screen & Book Opening
    loadingTitle: '3D માં નોટ્સનું પુસ્તક ખુલી રહ્યું છે...',
    openingBook: 'પાના ઝડપથી પલટાઈ રહ્યા છે — લૉગિન પેજ આવી રહ્યું છે...',
    calibrating: 'સિસ્ટમ્સ કેલિબ્રેશન ચાલુ છે...',
    calibrated100: 'પુસ્તક સંપૂર્ણ રીતે ખુલી ગયું — લૉગિન પેજ શરૂ થઈ રહ્યું છે',
    enterWorkspace: 'UNERA વર્કસ્પેસ ખોલો →',
    proceedToLogin: '💡 લેમ્પ લૉગિન પેજ પર જાઓ →',
    skipDirect: 'સીધા લૉગિન પેજ પર જાઓ',
    viewSphere: '3D સ્ફિયર કોર',
    viewNeural: 'ન્યુરલ નેટવર્ક ગ્રાફ',
    mouseTiltPrompt: '3D પરિપ્રેક્ષ્યમાં પુસ્તકને ફેરવવા માટે માઉસ હલાવો',

    // Top Navigation & Action Buttons
    home: 'હોમ',
    features: 'વિશેષતાઓ',
    howItWorks: 'તે કેવી રીતે કામ કરે છે',
    demo: 'ડેમો',
    studyWorkspace: 'સ્ટડી વર્કસ્પેસ',
    openStudy: 'અભ્યાસ શરૂ કરો',
    uploadNotes: 'નોટ્સ અપલોડ કરો',
    alarms: 'એલાર્મ',
    alarmScheduler: 'સ્ટડી એલાર્મ સેટ કરો',
    view3D: '3D વ્યૂ',
    login: 'લૉગિન',
    logout: 'સાઇન આઉટ',
    lightMode: 'લાઇટ',
    darkMode: 'ડાર્ક',

    // Landing Page Hero
    heroHeadlinePart1: 'અભ્યાસ કરો ',
    heroHeadlinePart2: 'તમારી પોતાની નોટ્સમાંથી.',
    heroSubtext: 'તમારી નોટ્સ અપલોડ કરો, પૃષ્ઠ-વાર સંદર્ભ સાથે પ્રશ્નો પૂછો, સ્વચાલિત અભ્યાસ એલાર્મ સેટ કરો અને તમારા AI શિક્ષક સાથે સીધો અવાજથી સંવાદ કરો.',
    zeroSetup: '⚡ કોઈ પૂર્વ સેટઅપની જરૂર નથી. રિકર્સન અને કૉલ સ્ટેક નોટ્સ પહેલાથી જ લોડ છે.',
    
    // Workspace Controls
    evaluatorTour: 'ડેમો ટૂર',
    costCaching: 'ખર્ચ અને કેશિંગ',
    institutionHub: 'સંસ્થા હબ',
    compareSources: 'દસ્તાવેજ સરખામણી',
    conceptDNA: 'કન્સેપ્ટ DNA',
    tutorChat: 'AI શિક્ષક ચેટ',
    askQuestionPlaceholder: 'તમારા પ્રશ્નો પૂછો, અથવા શંકા લખો...',
    send: 'મોકલો',
    voiceSpeak: 'બોલો',
    voiceStop: 'ઓડિયો રોકો',
    startStudyingNow: '🚀 હમણાં જ અભ્યાસ શરૂ કરો',
    snooze5Mins: '⏰ 5 મિનિટ પછી યાદ કરાવો',
    dismiss: 'બંધ કરો',
    alarmRingingTitle: 'સ્ટડી એલાર્મ વાગી રહ્યું છે!'
  }
};

export function getTranslation(lang: LanguageCode = 'en') {
  return translations[lang] || translations.en;
}
