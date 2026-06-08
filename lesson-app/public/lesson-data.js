// Shared lesson data — loaded by both teacher.html and student.html
// interactive: true  → has student response form + gate mechanism
// responseType: 'number' | 'checklist' | 'text' | 'done'

const LESSONS = [
  {
    id: 1, title: 'שיעור 1', subtitle: 'מה קורה לנו',
    goal: 'לבנות הבנה משותפת על קשב ועל מה שמשפיע עליו.',
    globalNote: 'שיעור שבו נשתמש בטלפון בחלק מהפעילויות ואז נניח אותו בצד. ברגעים שתלמיד מתקשה לעצור — אפשר להעלות לשיח: "שמתם לב כמה קשה היה לעצור?"',
    sections: [
      {
        id: 's11', title: 'פתיחה חוויתית', duration: 5,
        type: 'open_q', interactive: false,
        question: 'מתי בפעם האחרונה פתחתם את הטלפון לעשות משהו ספציפי, ואחרי כמה דקות קלטתם ששכחתם ממנו לגמרי?',
        instructions: 'חשבו דקה לפני שעונים. שניים–שלושה מספרים.',
        teacherNote: 'השיקוף: להחזיר למדבר מה שאמר, בלי לשפוט. לדוגמה: "אז קפצת לבדוק הודעה ומצאת את עצמך 20 דקות אחר כך בוידאו אחר לגמרי". לא ממסקנה, לא ממחמאה, לא מניתוח.'
      },
      {
        id: 's12', title: 'פעילות: ספירת התראות', duration: 7,
        type: 'counter', interactive: true, responseType: 'number',
        teacherNote: 'הפעילות מגיעה לפני הנתונים — כשמציגים אחר כך 400 ההתראות ביום, כל אחד כבר יודע את המספר שלו.',
        studentPrompt: 'בדקו בטלפון: כמה התראות קיבלתם אתמול לאורך כל היום? (כל סוגי ההתראות)',
        studentInput: 'הכנס מספר'
      },
      {
        id: 's13', title: 'מה זה קשב + 3 גורמים', duration: 10,
        type: 'factors', interactive: false,
        teacherNote: 'שאר הגורמים קיימים כרזרבה. בשיעור הזה — רק שלושה.',
        factors: [
          { icon: '😴', title: 'שינה', text: 'מחסור בשעות שינה פוגע ישירות ביכולת הריכוז ביום למחרת.', color: '#7c3aed' },
          { icon: '🔔', title: 'התראות', text: 'לא רק ההתראה עצמה, אלא גם הציפייה אליה — גוזלת קיבולת קוגניטיבית.', color: '#dc2626' },
          { icon: '📱', title: 'נוכחות הטלפון', text: 'גם כשהוא הפוך על השולחן, עצם נוכחותו גוזלת קיבולת.', color: '#2563eb' }
        ]
      },
      {
        id: 's14', title: 'פעילות: מנגנונים ממכרים', duration: 10,
        type: 'checklist_video', interactive: true, responseType: 'checklist',
        teacherNote: '"זה לא חולשה שלנו, זה עיצוב מכוון." לא להוסיף יותר — הסרטון עושה את העבודה.',
        studentPrompt: 'בחרו אפליקציה שאתם משתמשים בה הכי הרבה. סמנו את כל התכונות שמתאימות לה:',
        checks: [
          'מוחקת מה שאחרים פרסמו אחרי 24 שעות',
          'מראה תוכן שמעניין אותי — גם כשלא ביקשתי',
          'מראה מוצרים שאני עשוי לרצות לקנות',
          'עוברת לסרטון הבא אוטומטית',
          'שולחת התראה כשמישהו הגיב',
          'שולחת התראה כשמישהו שאני עוקב אחריו פרסם',
          'מראה כמה אנשים לחצו לייק / שיתפו',
          'מייצרת תוכן חדש כל הזמן — אף פעם לא נגמרת',
          'מהירה, צבעונית, ומגרה חזותית'
        ],
        videos: [
          { title: 'למה גלילה ממכרת?', url: 'https://www.youtube.com/results?search_query=Why+scrolling+social+media+addictive', note: 'הפעל כתוביות עברית' },
          { title: 'ניסוי 30 יום ללא פלאפון', url: 'https://www.youtube.com/results?search_query=I+Quit+My+Phone+30+Days+Brain', note: 'הפעל כתוביות עברית' },
          { title: 'בני נוער מדברים על ההתמכרות', url: 'https://www.youtube.com/results?search_query=teens+feel+addicted+smartphone', note: 'הפעל כתוביות עברית' },
          { title: 'ריקבון מוחי — המדע האמיתי', url: 'https://www.youtube.com/results?search_query=brain+rot+actual+science+scrolling', note: 'הפעל כתוביות עברית' }
        ]
      },
      {
        id: 's15', title: 'קשב דיגיטלי + נתוני ישראל', duration: 8,
        type: 'stats', interactive: false,
        teacherNote: 'כאן נזכרים בממוצע שחישבנו — הנתון הסטטיסטי הופך לאישי.',
        stats: [
          { num: '150 → 75 → 47', unit: 'שניות', label: 'זמן ממוצע של קשב רציף — מגמת ירידה לפי נתוני מארק', bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
          { num: '400', unit: 'התראות ביום', label: 'ממוצע לבני נוער בישראל', bg: '#fffbeb', text: '#d97706', border: '#fbbf24' }
        ]
      },
      {
        id: 's16', title: 'סגירה', duration: 5,
        type: 'close_q', interactive: true, responseType: 'text',
        question: 'מה הכי הפתיע אתכם בשיעור הזה?',
        instructions: 'כל אחד אומר מילה אחת.',
        teacherNote: 'המורה לא מגיבה. השיעור נגמר עם השאלה הזאת פתוחה.',
        studentPrompt: 'מה הכי הפתיע אותך בשיעור?',
        studentInput: 'מילה אחת או משפט קצר'
      }
    ]
  },
  {
    id: 2, title: 'שיעור 2', subtitle: 'מה קורה לי, ומה קורה בעולם',
    goal: 'להתחבר לחוויה האישית עם הטלפון ולהרחיב אותה לתמונה עולמית.',
    globalNote: '',
    sections: [
      {
        id: 's21', title: 'רפלקציה אישית', duration: 10,
        type: 'reflection', interactive: true, responseType: 'done',
        teacherNote: 'הרפלקציה מגיעה לפני הסרטון. מה שכתוב נשאר אצל התלמידים — המורה לא קוראת.',
        intro: 'פתחו מחברת וכתבו. אפשר לבחור חלק מהשאלות. מה שכתוב נשאר אצלכם.',
        questions: [
          'מתי הטלפון עוזר לך? מתי הוא מפריע?',
          'יש רגע ביום שהיית מעדיף/ה שהטלפון לא היה שם?',
          'מה הדבר האחרון שעשית בטלפון אתמול לפני השינה?',
          'אם הטלפון שלך היה נעלם לשבוע, מה היית מרגיש/ה?',
          'יש משהו שאתה/את עושה בטלפון שאחר כך מרגיש/ה פחות טוב ממנו?'
        ]
      },
      {
        id: 's22', title: 'סרטון', duration: 8,
        type: 'video', interactive: false,
        teacherNote: 'לצפות מראש ולבחור לפי הכיתה.',
        videos: [
          { title: 'מכינת מפנה × מהפכת הקשב', url: 'https://youtu.be/QkGRGeAhzmA', note: '' },
          { title: 'TED Talk — Tanner Welton', url: 'https://www.ted.com/talks/tanner_welton_cell_phone_addiction', note: 'הפעל כתוביות עברית' }
        ]
      },
      {
        id: 's23', title: 'שיח על הסרטון', duration: 12,
        type: 'open_q', interactive: true, responseType: 'text',
        question: 'מה אתם אומרים על זה? מסכימים? מזדהים? או שהם מגזימים?',
        instructions: 'שאלה אחת בלבד, ואז השיח.',
        teacherNote: 'לא לכוון לתשובה נכונה. לא לנתח. לא להסיק. לאפשר שיתוף אמיתי.',
        studentPrompt: 'מה דעתך על הסרטון? (אפשר מסכים, לא מסכים, או משהו אחר)',
        studentInput: 'כתוב את דעתך'
      },
      {
        id: 's24', title: 'מה קורה בעולם', duration: 15,
        type: 'world', interactive: false,
        teacherNote: 'לחצו על כל מדינה לחשיפת הפרטים. הסיום: "בשיעור הבא נדבר על מה זה אומר כאן, אצלנו."',
        closing: 'בשיעור הבא נדבר על מה זה אומר כאן, אצלנו.',
        examples: [
          { country: '🇫🇷 צרפת', text: 'אסרה שימוש בטלפונים בבתי ספר ב-2018, ב-2023 הרחיבה לכלול הפסקות.' },
          { country: '🇦🇺 אוסטרליה', text: 'הנהיגה מדיניות הגבלה בשנים האחרונות.' },
          { country: '🇳🇱 הולנד', text: 'אסרה שימוש בטלפונים בבתי ספר.' },
          { country: '🇳🇿 ניו זילנד', text: 'נמדד שיפור בריכוז ובקשרים חברתיים.' },
          { country: '🇺🇸 ארה"ב', text: 'אלפי בתי ספר עברו לכיסי נעילה (Yondr).' },
          { country: '🇮🇱 ישראל', text: 'תל אביב מובילה מהלך עירוני שיטתי של הוצאת טלפונים מכל התיכונים.' }
        ]
      }
    ]
  },
  {
    id: 3, title: 'שיעור 3', subtitle: 'מה קורה אצלנו',
    goal: 'לתת לתלמידים מקום אמיתי להגיב על המהלך. לא לשכנע — לשמוע.',
    globalNote: 'לדעת לענות על: מתי מתחילים, איפה הלוקרים, מה עם חירום.',
    sections: [
      {
        id: 's31', title: 'פתיחה', duration: 3,
        type: 'text', interactive: false,
        text: 'בשני השיעורים הקודמים דיברנו על מה קורה לנו עם הטלפונים ועל מה שמדינות בעולם כבר עשו. היום אני רוצה לדבר על מה שהולך לקרות כאן, אצלנו.',
        teacherNote: ''
      },
      {
        id: 's32', title: 'סרטון רון חולדאי', duration: 4,
        type: 'video', interactive: false,
        teacherNote: 'בלי הקדמה. בלי סיכום אחרי. ישר לשיח.',
        videos: [
          { title: 'רון חולדאי — ראש עיריית תל אביב', url: 'https://www.tiktok.com/@drorgloberman/video/7473752317486042376', note: 'פתח ב-TikTok' }
        ]
      },
      {
        id: 's33', title: 'שיח: מה מפחיד ומה מעצבן', duration: 15,
        type: 'disc_board', interactive: true, responseType: 'text',
        intro: 'הטלפונים עומדים לצאת. אני רוצה לדעת מה קשה לכם עם זה.',
        teacherNote: 'לרשום הכל, מילה במילה. לא להגיב. לא לסייג. רק לתעד ולהנהן.',
        expected: 'חשש מהחמצות • קושי עם הורים • תחושה שלא הוגן • עצבים • פחד ממשעמם • סומכים פחות',
        columns: [
          { label: 'מה מפחיד', cls: 'red-col', i: 0 },
          { label: 'מה מעצבן', cls: 'orange-col', i: 1 }
        ],
        studentPrompt: 'מה הכי קשה לך עם המהלך הזה? (אפשר לכתוב יותר מדבר אחד)',
        studentInput: 'כתוב מה קשה לך'
      },
      {
        id: 's34', title: 'שיח: מה השאלות שלכם', duration: 10,
        type: 'q_board', interactive: true, responseType: 'text',
        intro: 'מה אתם רוצים לדעת? שאלות לוגיסטיות, שאלות עקרוניות, כל שאלה.',
        closing: 'את השאלות האלה אני לוקחת. חלקן אני יכולה לענות, חלקן אצטרך לברר.',
        teacherNote: 'לא להבטיח שינוי. להבטיח שנשמע.',
        studentPrompt: 'מה השאלה שלך על המהלך?',
        studentInput: 'כתוב שאלה'
      },
      {
        id: 's35', title: 'סגירה', duration: 10,
        type: 'close_prompts', interactive: true, responseType: 'text',
        intro: 'הטלפונים יוצאים. זה גם שינוי גדול ולכולנו יש חששות.',
        question: 'האם יש דבר אחד טוב שעשוי לצאת מהמהלך הזה?',
        prompts: [
          'אולי יהיה קל יותר להתרכז בשיעורים שממש אוהבים',
          'אולי שיחות בהפסקות יהיו יותר מצחיקות',
          'אולי פחות לחץ מהתראות',
          'אולי נהיה רגועים יותר — כי כולם מנותקים ביחד',
          'אולי ההוכחה שאנחנו מסוגלים לחיות שמונה שעות בלי זה',
          'אולי פשוט לגלות מה קורה כשמנסים'
        ],
        closingLine: 'זה מהלך גדול ואנחנו ככיתה נעבור אותו ביחד.',
        teacherNote: 'עצם השאלה נזרעת גם בשקט.',
        studentPrompt: 'האם יש דבר אחד טוב שעשוי לצאת מהמהלך הזה? (לא חייבים)',
        studentInput: 'כתוב משהו (אופציונלי)'
      }
    ]
  },
  {
    id: 4, title: 'שיעור 4', subtitle: 'איך זה נראה במציאות',
    goal: 'לעבור מהשיח אל הפרקטיקה. לתת מידע ברור, לאפשר שאלות, לתת חוויה בגוף.',
    globalNote: 'לדעת לענות על: מתי מתחילים, איפה לוקרים, מה קורה בהפסקה, חירום, נתפסים.',
    sections: [
      {
        id: 's41', title: 'פתיחה — סרטון', duration: 5,
        type: 'video', interactive: false,
        teacherNote: 'רק דקה וחצי ראשונות — הקשיים ה"התמכרותיים".',
        videos: [
          { title: 'ניסוי 30 יום — 1.5 דקות ראשונות', url: 'https://www.youtube.com/results?search_query=I+Quit+My+Phone+30+Days+Brain', note: 'רק דקה וחצי ראשונות' }
        ]
      },
      {
        id: 's42', title: 'חזרה מהשיעור הקודם', duration: 5,
        type: 'text', interactive: false,
        text: 'בשיעור הקודם כתבנו על הלוח — מה מפחיד, מה מעצבן, ומה השאלות. אמרתי שאני לוקחת אותן. היום ננסה לענות.',
        teacherNote: 'לא לפתוח דיון מחדש. רק להזכיר שנשמעו.'
      },
      {
        id: 's43', title: 'תקנון דרך עיניהם', duration: 15,
        type: 'policy', interactive: false,
        teacherNote: 'להגיע מוכן/ת עם תשובות. עדכנו את התשובות לפני השיעור.',
        topics: [
          { q: 'מתי בדיוק מתחילים?', a: '' },
          { q: 'איפה יאוחסנו הטלפונים?', a: '' },
          { q: 'מה קורה בהפסקה הגדולה?', a: '' },
          { q: 'מה עם הקפיטריה?', a: '' },
          { q: 'מה עם מצב חירום?', a: '' },
          { q: 'מה קורה אם נתפסים?', a: '' },
          { q: 'קשר עם הורים?', a: '' }
        ]
      },
      {
        id: 's44', title: 'שאלות פתוחות', duration: 5,
        type: 'q_board', interactive: true, responseType: 'text',
        intro: 'מה עדיין לא ברור?',
        closing: 'אברר ואחזור.',
        teacherNote: '',
        studentPrompt: 'יש לך שאלה שעדיין לא ענינו עליה?',
        studentInput: 'כתוב שאלה (אופציונלי)'
      },
      {
        id: 's45', title: 'התנסות: 10 דקות בלי טלפון', duration: 10,
        type: 'experience', interactive: true, responseType: 'done',
        teacherNote: 'זו חוויה, לא מבחן. המטרה: לדעת איך זה מרגיש.',
        instruction: 'עכשיו אנחנו נחיה 10 דקות כמו שזה יהיה. טלפונים בצד.',
        options: ['שיחה חופשית', 'כתיבה חופשית', 'פעילות יצירתית', 'שקט ותצפית'],
        studentPrompt: 'הניחו את הטלפון ועשו אחד מהדברים האלה. כשתסיימו — לחצו סיימתי.'
      },
      {
        id: 's46', title: 'סגירה', duration: 5,
        type: 'close_q', interactive: true, responseType: 'text',
        question: 'משפט אחד — איך היו ה-10 הדקות האלה?',
        instructions: 'כל אחד אומר משפט אחד.',
        teacherNote: 'המורה מקשיבה ולא מגיבה.',
        studentPrompt: 'משפט אחד על ה-10 הדקות האחרונות',
        studentInput: 'כתוב משפט אחד'
      }
    ]
  }
];

// Helper: get all sections flat with lesson reference
function getAllSections() {
  return LESSONS.flatMap(l => l.sections.map(s => ({ ...s, lessonId: l.id, lessonIndex: LESSONS.indexOf(l) })));
}

function getSectionByIds(lessonIdx, sectionIdx) {
  return LESSONS[lessonIdx]?.sections[sectionIdx] || null;
}

function isLastSection(lessonIdx, sectionIdx) {
  const lesson = LESSONS[lessonIdx];
  if (!lesson) return true;
  return sectionIdx >= lesson.sections.length - 1 && lessonIdx >= LESSONS.length - 1;
}

function nextIds(lessonIdx, sectionIdx) {
  const lesson = LESSONS[lessonIdx];
  if (sectionIdx < lesson.sections.length - 1) return { lesson: lessonIdx, section: sectionIdx + 1 };
  if (lessonIdx < LESSONS.length - 1) return { lesson: lessonIdx + 1, section: 0 };
  return null;
}
