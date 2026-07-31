/* ─────────────────────────────────────────────────────────────────────────────
   Strings. Every user-visible character in the product lives here.

   INVARIANT 5 — zh-TW is the interface. This build ships zh-TW only, a dated
   exception recorded in the design doc's Scope Exceptions; English completes
   before any second site. The `Strings` type is the contract an English locale
   must satisfy, so adding it later is an implementation, not a refactor.

   TONE (PRODUCT.md) — dignified. No cheerfulness, no encouragement, no
   exclamation marks. A finished trial reads 完成. Never 停止, never 加油,
   never 太棒了. Someone who manages three reps has a valid recorded outcome and
   the copy must not suggest they broke something.
   ───────────────────────────────────────────────────────────────────────────── */

export interface Strings {
  readonly app: {
    readonly name: string
    readonly assessmentName: string
  }
  readonly demo: {
    readonly badge: string
    readonly detail: string
  }
  readonly phase: {
    readonly pre: string
    readonly post: string
  }
  readonly tracking: {
    readonly live: string
    readonly idle: string
    readonly lost: string
  }
  readonly roster: {
    readonly title: string
    readonly outstanding: string
    readonly done: string
    readonly progress: (done: number, total: number) => string
    readonly attendanceNote: (n: number) => string
    readonly start: string
    readonly review: string
    /** Accessible names. The visible label stays short; these add who it acts on. */
    readonly startFor: (label: string) => string
    readonly reviewFor: (label: string) => string
    readonly openSheet: string
    readonly emptyTitle: string
    readonly emptyBody: string
  }
  readonly status: {
    readonly awaiting: string
    readonly complete: string
    readonly incomplete: string
    readonly handContact: string
    readonly unable: string
    readonly aborted: string
    readonly voided: string
    readonly corrected: string
  }
  readonly trial: {
    readonly repsOf: (done: number, total: number) => string
    readonly repsLabel: string
    readonly cue: string
    readonly cueHint: string
    readonly begin: string
    readonly end: string
    readonly discard: string
    readonly complete: string
    readonly viewResult: string
    readonly voidTitle: string
    readonly voidBody: string
    readonly restart: string
    readonly backToRoster: string
    readonly srRepAnnounce: (n: number, total: number) => string
  }
  /* ── 場次 ────────────────────────────────────────────────────────────────
     Several are open on one device at once, so every one of these strings is
     load-bearing against ONE failure: a trial recorded into the wrong 期 or the
     wrong 階段, which nothing on the printed sheet would ever reveal. ───────── */
  readonly session: {
    /** Landmark name for the context band. */
    readonly contextLabel: string
    readonly siteLabel: string
    readonly blockLabel: string
    readonly phaseLabel: string
    readonly dateLabel: string
    readonly statusOpen: string
    readonly statusCompleted: string
    /** One line naming a session in full. Used wherever it has to be unambiguous. */
    readonly describe: (site: string, block: string, phase: string) => string
    /** Announced when the active session changes. Switching is never silent. */
    readonly switched: (what: string) => string

    readonly listLede: string
    readonly groupOpen: string
    readonly groupCompleted: string
    readonly resume: string
    readonly view: string
    readonly resumeFor: (what: string) => string
    readonly viewFor: (what: string) => string
    readonly newSession: string
    readonly current: string
    readonly progress: (done: number, total: number) => string
    readonly attendeeCount: (n: number) => string
    readonly emptyTitle: string
    readonly emptyBody: string

    readonly endAction: string
    readonly endTitle: string
    readonly endBody: string
    readonly endConfirm: string
    readonly reopenAction: string
    readonly reopenTitle: string
    readonly reopenBody: string
    readonly reopenConfirm: string
    readonly cancel: string

    /** Refusals. Every one names what to do next, not just what went wrong. */
    readonly refuseTitle: string
    readonly refuse: {
      readonly no_session: string
      readonly unresolved: string
      readonly completed: string
      readonly no_attendees: string
      readonly not_attending: string
    }
    readonly refuseGoto: string
    readonly readOnlyNote: string

    /** Setup, when the configured 據點 / 期 / 階段 already has a 場次. */
    readonly willResume: (what: string) => string
    readonly willReopen: (what: string) => string
    readonly willCreate: string
    readonly beginResume: string
    readonly beginReopen: string
  }
  readonly setup: {
    readonly title: string
    readonly lede: string
    readonly siteLabel: string
    readonly blockLabel: string
    readonly yearLabel: string
    readonly cycleLabel: string
    readonly cycleOf: (n: number) => string
    readonly phaseChoice: string
    readonly attendeesTitle: string
    readonly attendeesHint: string
    readonly selectAll: string
    readonly selectNone: string
    readonly enrolledCount: (n: number) => string
    readonly addTitle: string
    readonly addFieldLabel: string
    readonly addFieldHint: string
    readonly addAction: string
    readonly addPlaceholder: string
    readonly attendanceCount: (n: number) => string
    readonly fundedFloor: (n: number) => string
    readonly fundedNote: string
    readonly framingTitle: string
    readonly framingHint: string
    readonly begin: string
    readonly idAssigned: (id: string) => string
  }
  readonly detail: {
    readonly noRecord: string
    readonly noRecordBody: string
    readonly splitsTitle: string
    readonly splitsHint: string
    readonly splitOf: (n: number) => string
    readonly totalLabel: string
    readonly dateLabel: string
    readonly protocolLabel: string
    readonly protocolValid: string
    readonly protocolInvalid: string
    readonly deltaTitle: string
    readonly deltaFaster: string
    readonly deltaSlower: string
    readonly deltaSame: string
    readonly historyTitle: string
    readonly historyHint: string
    readonly attemptN: (n: number) => string
    readonly correctsPrior: string
    readonly supersededBy: string
    readonly recordedAt: (t: string) => string
    readonly reasonLabel: string
    readonly firstContactRep: (n: number) => string
    readonly statsTitle: string
    readonly statsHint: string
    readonly slowdownLabel: string
    readonly slowdownSlower: (s: string) => string
    readonly slowdownFaster: (s: string) => string
    readonly slowdownSame: string
    readonly meanLabel: string
    readonly fastestLabel: string
    readonly slowestLabel: string
    readonly spreadLabel: string
    readonly repNo: (n: number) => string
    readonly overlayTitle: string
    readonly overlayHint: string
    readonly overlayNeedsBoth: string
  }
  readonly tier2: {
    readonly title: string
    readonly status: string
    readonly body: string
    readonly plannedTitle: string
    readonly planned: readonly string[]
    readonly gateTitle: string
    readonly gate: string
    readonly survives: string
    readonly fails: string
    readonly indeterminate: string
    readonly fallback: string
  }
  readonly nav: {
    readonly switchToPre: string
    readonly switchToPost: string
    readonly home: string
    readonly back: string
    readonly placeSessions: string
    readonly placeSetup: string
    /** Landmark label for the back-to-hub control. */
    readonly whereLabel: string
    readonly backToRoster: string
    readonly placeRoster: string
    readonly placeTrial: (label: string) => string
    readonly placeResult: (label: string) => string
    readonly placeTrialResult: (label: string) => string
    readonly placeSheet: string
  }
  readonly camera: {
    readonly title: string
    readonly selfView: string
    readonly selfViewHint: string
    readonly privacy: string
    readonly enable: string
    readonly disable: string
    readonly starting: string
    readonly idle: string
    readonly denied: string
    readonly notfound: string
    readonly insecure: string
    readonly unsupported: string
    readonly error: string
    readonly signalLabel: string
    readonly signalLive: string
    readonly signalStalled: string
    readonly signalEnded: string
  }
  readonly result: {
    readonly title: string
    readonly elapsed: string
    readonly seconds: string
    readonly reps: string
    readonly perRep: string
    readonly repN: (n: number) => string
    readonly noTime: string
    readonly accept: string
    readonly redo: string
    readonly correct: string
    readonly seatHeight: string
    readonly cm: string
    readonly next: (label: string) => string
    readonly noneLeft: string
    readonly fullRecord: string
    readonly flagIncomplete: (n: number) => string
    readonly flagHandContact: (n: number) => string
    readonly flagUnable: string
    readonly flagProtocolInvalid: string
  }
  readonly correction: {
    readonly title: string
    readonly body: string
    readonly noteLabel: string
    readonly notes: {
      readonly rep_miscount: string
      readonly wrong_participant: string
      readonly hand_contact_missed: string
      readonly other: string
    }
    readonly repsLabel: string
    readonly submit: string
    readonly cancel: string
    readonly appendNote: string
  }
  readonly abort: {
    readonly title: string
    readonly body: string
    readonly reasons: {
      readonly wrong_participant: string
      readonly interruption: string
      readonly participant_declined: string
      readonly equipment: string
      readonly other: string
    }
    readonly confirm: string
    readonly cancel: string
  }
  readonly unable: {
    readonly action: string
    readonly title: string
    readonly body: string
    readonly confirm: string
    readonly cancel: string
  }
  readonly sheet: {
    readonly title: string
    readonly subtitle: string
    readonly site: string
    readonly block: string
    readonly printedOn: string
    readonly colId: string
    readonly colLabel: string
    readonly colPre: string
    readonly colPost: string
    readonly colChange: string
    readonly colNote: string
    /** Which 期 and which 階段 this sheet covers. Screen AND paper. */
    readonly coverage: string
    readonly coveragePhase: (phase: string, date: string, n: number) => string
    readonly coverageNotHeld: (phase: string) => string
    readonly generatedFrom: string
    readonly generatedFromValue: (phase: string, date: string) => string
    readonly unitSeconds: string
    readonly notRecorded: string
    readonly notComparable: string
    readonly summaryAssessed: string
    readonly summaryProtocolValid: string
    readonly summaryAttendance: string
    readonly footerScope: string
    readonly footerComparable: string
    readonly footerHandContact: string
    readonly footerPrivacy: string
    readonly signFacilitator: string
    readonly signLead: string
    readonly print: string
    readonly close: string
    /** Wraps an inline aside, e.g. 已更正. Full-width parens are copy, not code. */
    readonly aside: (inner: string) => string
  }
  readonly scenario: {
    readonly title: string
    readonly hint: string
    readonly close: string
    readonly groupSessions: string
    readonly groupTrial: string
    readonly groupEdge: string
    readonly groupSheet: string
    readonly sessionList: string
    readonly sheetMixed: string
    readonly trials: {
      readonly complete_typical: string
      readonly complete_slow: string
      readonly incomplete_three: string
      readonly hand_contact: string
      readonly void_midway: string
    }
    readonly results: {
      readonly complete: string
      readonly incomplete: string
      readonly hand_contact: string
      readonly unable: string
      readonly aborted: string
    }
  }
}

const zhTW: Strings = {
  app: {
    name: 'VeloCare',
    assessmentName: '五次起立坐下量測',
  },

  demo: {
    // Honest marker. This must never read as a working measurement system.
    //
    // Reworded when the framing preview landed. The previous copy said
    // 未連接攝影機 ("no camera is connected"), which the opt-in preview makes
    // false the moment a facilitator enables it. An honesty notice that is
    // literally untrue is worse than none, so it now separates the two claims:
    // the measurement DATA is simulated, and the camera is preview only.
    badge: '示範模式 · 模擬資料',
    detail:
      '本頁為介面原型，量測資料為模擬產生，未進行任何實際量測。鏡頭僅供取景預覽，不錄影、不儲存影像。',
  },

  phase: {
    pre: '前測',
    post: '後測',
  },

  tracking: {
    live: '追蹤中',
    idle: '待機',
    lost: '追蹤中斷',
  },

  roster: {
    title: '本期名單',
    outstanding: '待量測',
    done: '已量測',
    progress: (done, total) => `已量測 ${done} / ${total} 人`,
    attendanceNote: (n) => `本期出席 ${n} 人`,
    start: '開始量測',
    review: '查看紀錄',
    startFor: (label) => `開始量測：${label}`,
    reviewFor: (label) => `查看紀錄：${label}`,
    openSheet: '產生報表',
    emptyTitle: '本期尚無名單',
    emptyBody: '請先於現場紙本名冊建立代號，再於此處對應。',
  },

  status: {
    awaiting: '待量測',
    complete: '已量測',
    incomplete: '未完成五次',
    handContact: '手部支撐',
    unable: '無法進行',
    aborted: '已作廢',
    voided: '追蹤中斷',
    corrected: '已更正',
  },

  trial: {
    repsOf: (done, total) => `${done} / ${total}`,
    repsLabel: '次',
    cue: '請準備',
    cueHint: '雙手抱胸，坐穩後由工作人員開始。',
    begin: '開始',
    end: '結束',
    discard: '作廢',
    complete: '完成',
    viewResult: '查看紀錄',
    voidTitle: '追蹤中斷',
    voidBody: '本次未能完整記錄，請重新開始。先前資料不列入。',
    restart: '重新開始',
    backToRoster: '回名單',
    srRepAnnounce: (n, total) => `第 ${n} 次，共 ${total} 次`,
  },

  session: {
    contextLabel: '目前場次',
    siteLabel: '據點',
    blockLabel: '期別',
    phaseLabel: '階段',
    dateLabel: '日期',
    statusOpen: '進行中',
    statusCompleted: '已結束',
    // The full name of a session, in the order a facilitator reads it aloud.
    describe: (site, block, phase) => `${site}　${block}　${phase}`,
    switched: (what) => `已切換場次：${what}`,

    listLede: '同一台機器上可同時開啟多個場次。請先選定要記錄的場次，再開始量測。',
    groupOpen: '進行中的場次',
    groupCompleted: '已結束的場次',
    resume: '進入本場',
    view: '查看本場',
    resumeFor: (what) => `進入本場：${what}`,
    viewFor: (what) => `查看本場：${what}`,
    newSession: '新增場次',
    current: '目前場次',
    progress: (done, total) => `已量測 ${done} / ${total} 人`,
    attendeeCount: (n) => `出席 ${n} 人`,
    emptyTitle: '尚無任何場次',
    emptyBody: '請先新增一個場次，設定據點、期別與階段。',

    endAction: '結束本場',
    endTitle: '結束本場',
    // States the consequence and the reversal in the same breath: a facilitator
    // who cannot undo an action will avoid using it.
    endBody: '結束後本場不再接受量測、更正或無法進行的紀錄。已記錄的資料完整保留，仍可查看與列印。日後可再重新開啟。',
    endConfirm: '確認結束本場',
    reopenAction: '重新開啟本場',
    reopenTitle: '重新開啟本場',
    reopenBody: '重新開啟後，本場可繼續記錄量測。新的紀錄會計入本期本階段。',
    reopenConfirm: '確認重新開啟',
    cancel: '取消',

    // ── Refusals ──────────────────────────────────────────────────────────
    // Same posture as 不可比較 on the報表: refuse rather than record into a
    // guess. Each line says what to do next, because a disabled control tells a
    // standing工作人員 nothing.
    refuseTitle: '尚未確定要記錄到哪一場',
    refuse: {
      no_session: '目前沒有選定的場次。請先回到場次清單，選定本次要記錄的據點、期別與階段。',
      unresolved: '本場次的期別資料不完整，無法確認要記錄到哪一期。請回到場次清單重新選定。',
      completed: '本場已結束，不再接受新的量測。若確定要繼續記錄，請先於本頁重新開啟本場。',
      no_attendees: '本場出席名單為空，沒有可記錄的對象。請於場次設定勾選今天到場的長輩。',
      not_attending: '這位長輩不在本場的出席名單內。請確認選對場次，或於場次設定將其加入本場。',
    },
    refuseGoto: '回場次清單',
    readOnlyNote: '本場已結束，僅供查看。若要繼續記錄，請先重新開啟本場。',

    willResume: (what) => `此組合已有場次，將接續原場次：${what}`,
    willReopen: (what) => `此場次已結束，開始後將重新開啟：${what}`,
    willCreate: '此組合尚無場次，將建立新的場次。',
    beginResume: '接續本場',
    beginReopen: '重新開啟並開始',
  },

  setup: {
    title: '場次設定',
    lede: '設定本場的據點、期別與階段，並勾選今天到場的長輩。',
    siteLabel: '據點',
    blockLabel: '期別',
    yearLabel: '年度',
    cycleLabel: '期別',
    cycleOf: (n) => `第 ${n} 期`,
    phaseChoice: '本場階段',
    attendeesTitle: '本場出席名單',
    attendeesHint: '勾選今天到場的長輩。未到場者仍在收案名單內。',
    selectAll: '全選',
    selectNone: '全部取消',
    enrolledCount: (n) => `收案 ${n} 人`,
    addTitle: '新增長輩',
    addFieldLabel: '稱謂',
    // Invariant 2, said out loud at the one place someone might type a name.
    addFieldHint: '僅供現場辨識之簡稱。請勿輸入姓名、生日或身分證字號。代號由系統自動指定。',
    addAction: '新增至收案名單',
    addPlaceholder: '例如：王阿姨',
    attendanceCount: (n) => `本場出席 ${n} 人`,
    fundedFloor: (n) => `給付門檻：每期平均 ${n} 人`,
    // A count, not a warning. The device reports the number; the 據點 decides
    // what to do about it. No colour, no icon, no instruction.
    fundedNote: '本欄僅供現場參考，實際給付以主管機關核定為準。',
    framingTitle: '鏡頭確認',
    framingHint: '建議在長輩就座前先確認取景範圍。',
    begin: '開始本場',
    idAssigned: (id) => `已指定代號 ${id}`,
  },

  detail: {
    noRecord: '本階段尚無紀錄',
    noRecordBody: '此階段尚未進行量測，或紀錄已作廢。',
    splitsTitle: '各次起立時間',
    splitsHint: '本次量測內每一次起立所需時間。',
    splitOf: (n) => `第 ${n} 次`,
    totalLabel: '總時間',
    dateLabel: '量測日期',
    protocolLabel: '測驗規範',
    protocolValid: '符合',
    protocolInvalid: '不符合',
    deltaTitle: '前後測差值',
    deltaFaster: '較前測快',
    deltaSlower: '較前測慢',
    deltaSame: '與前測相同',
    historyTitle: '完整嘗試紀錄',
    historyHint: '所有嘗試皆保留於紀錄檔。更正為另存一筆，不會覆蓋原紀錄。',
    attemptN: (n) => `第 ${n} 次嘗試`,
    correctsPrior: '更正前一筆紀錄',
    supersededBy: '已由更正紀錄取代',
    recordedAt: (t) => `紀錄時間 ${t}`,
    reasonLabel: '原因',
    firstContactRep: (n) => `第 ${n} 次起偵測到手部支撐`,

    statsTitle: '本次量測統計',
    // Arithmetic on the recorded times. No threshold, no grading, no norm.
    statsHint: '以下數值由本次各次起立時間計算，僅為算術結果，不含任何判讀或分級。',
    slowdownLabel: '第 5 次與第 1 次差',
    slowdownSlower: (sec) => `較第 1 次慢 ${sec} 秒`,
    slowdownFaster: (sec) => `較第 1 次快 ${sec} 秒`,
    slowdownSame: '與第 1 次相同',
    meanLabel: '平均每次',
    fastestLabel: '最快一次',
    slowestLabel: '最慢一次',
    spreadLabel: '最快與最慢差',
    repNo: (n) => `第 ${n} 次`,
    overlayTitle: '前後測各次時間對照',
    overlayHint: '同一位長輩的兩次量測並列比較，共用同一刻度。兩個量測點不構成趨勢圖。',
    overlayNeedsBoth: '需前測與後測皆有各次時間，方可並列比較。',
  },

  // ── Tier 2 roadmap. A statement of intent, never a preview of data. ────────
  tier2: {
    title: '第二階段（規劃中）',
    status: '尚未開發',
    body: '以下項目為規劃方向，本版本並未實作，畫面上不會出現任何相關數值。是否開發取決於一項已預先登錄的實驗結果。',
    plannedTitle: '規劃中的輸出',
    planned: [
      '尖峰速度（peak velocity）',
      '平均速度（mean velocity）',
      '組內速度衰減（velocity loss）',
    ],
    gateTitle: '開發條件',
    gate: '八月進行之預先登錄實驗，n=6–8，側面 120 fps 並置入平面尺標；判定標準於實驗前公開，事後不得更動。',
    survives: '通過：低座高時最後一次較第一次單調衰減超過 20%，且各次變異係數小於 7%，並無代償動作；標準座高時則否。',
    fails: '不通過：組內尖峰速度變異係數大於或等於總衰減幅度；或次間停頓增加超過 40% 而向心速度下降不足 10%；或三分之一以上受試者在第 8 次前出現非單調速度或手部支撐。',
    indeterminate: '未達判定：視同不通過。預先登錄若留有模糊地帶，即非預先登錄。',
    fallback: '若不通過，改以代償偵測為停止條件（次間停頓、軀幹前傾代償、關節活動度衰減、手部支撐），完全不含速度項目。第一階段不受影響。',
  },

  nav: {
    switchToPre: '切換至前測',
    switchToPost: '切換至後測',
    home: '場次清單',
    back: '上一層',
    placeSessions: '場次清單',
    placeSetup: '新增場次',
    whereLabel: '目前位置',
    backToRoster: '回本期名單',
    placeRoster: '本期名單',
    placeTrial: (label) => `${label}．量測`,
    placeResult: (label) => `${label}．紀錄`,
    placeTrialResult: (label) => `${label}．本次量測`,
    placeSheet: '報表',
  },

  camera: {
    title: '鏡頭取景',
    selfView: '自己的畫面',
    selfViewHint: '請確認整個人都在框內。',
    // Stated next to the live image, not buried in a settings page. Must stay
    // literally true of the code in useCameraPreview.ts: preview only, no
    // capture, no analysis, no retention.
    privacy: '畫面僅即時顯示於本機，不錄影、不擷取、不分析、不上傳、不儲存。關閉後立即結束。',
    enable: '開啟鏡頭取景',
    disable: '關閉鏡頭',
    starting: '啟動中…',
    idle: '尚未開啟鏡頭。開啟後可在開始前確認取景範圍。',
    denied: '未取得鏡頭權限。可於瀏覽器網址列重新允許，或直接以模擬資料操作。',
    notfound: '找不到可用的鏡頭。可直接以模擬資料操作。',
    insecure: '目前連線非安全來源，瀏覽器不提供鏡頭。可直接以模擬資料操作。',
    unsupported: '此瀏覽器不支援鏡頭取景。可直接以模擬資料操作。',
    error: '無法開啟鏡頭。可直接以模擬資料操作。',
    // 訊號, not 追蹤. This build performs no pose estimation, so it reports
    // whether the camera is still delivering frames — never a tracking or
    // confidence figure it has no way to compute.
    // Worded so they cannot be mistaken for the tracking chip beside them in
    // the rail (追蹤中 / 待機 / 追蹤中斷). That one is simulated; this one is real.
    signalLabel: '鏡頭訊號',
    signalLive: '鏡頭訊號正常',
    signalStalled: '鏡頭訊號不穩',
    signalEnded: '鏡頭已關閉',
  },

  result: {
    title: '本次紀錄',
    elapsed: '總時間',
    seconds: '秒',
    reps: '完成次數',
    perRep: '各次時間',
    repN: (n) => `第 ${n} 次`,
    noTime: '未計時',
    accept: '確認並回名單',
    redo: '重新量測',
    correct: '更正紀錄',
    seatHeight: '座高',
    cm: '公分',
    next: (label) => `下一位：${label}`,
    noneLeft: '回名單',
    fullRecord: '查看完整紀錄',
    // Descriptive, never evaluative. These are read out loud in a room, so they
    // say what was measured and stop there.
    flagIncomplete: (n) => `本次完成 ${n} 次，未達五次。這是有效的紀錄結果。`,
    flagHandContact: (n) => `第 ${n} 次起偵測到手部支撐。時間仍完整記錄。`,
    flagUnable: '記錄為無法進行。這是有效的紀錄結果。',
    flagProtocolInvalid: '本次不符合雙手抱胸之測驗規範，時間僅供現場參考。',
  },

  correction: {
    title: '更正紀錄',
    body: '原紀錄會保留，更正將另存一筆。這是正常操作。',
    noteLabel: '更正原因',
    notes: {
      rep_miscount: '次數計算有誤',
      wrong_participant: '對應代號有誤',
      hand_contact_missed: '未記錄到手部支撐',
      other: '其他',
    },
    repsLabel: '更正後完成次數',
    submit: '儲存更正',
    cancel: '取消',
    appendNote: '原紀錄仍會保留於紀錄檔中。',
  },

  abort: {
    title: '作廢本次量測',
    body: '本次不列入紀錄，並記錄作廢原因。',
    reasons: {
      wrong_participant: '對應代號有誤',
      interruption: '現場中斷',
      participant_declined: '長輩表示不進行',
      equipment: '器材問題',
      other: '其他',
    },
    confirm: '確認作廢',
    cancel: '取消',
  },

  unable: {
    action: '記錄為無法進行',
    title: '記錄為無法進行',
    body: '此為有效的紀錄結果。長輩仍在本期名單內，出席照常計算。',
    confirm: '確認記錄',
    cancel: '取消',
  },

  sheet: {
    title: '五次起立坐下量測紀錄',
    subtitle: '預防及延緩失能照護服務 — 前後測時間紀錄表',
    site: '服務提供單位',
    block: '期別',
    printedOn: '列印日期',
    colId: '代號',
    colLabel: '稱謂',
    colPre: '前測（秒）',
    colPost: '後測（秒）',
    colChange: '差值（秒）',
    colNote: '備註',
    // Which 期 and which 階段 this sheet covers, stated on the sheet itself.
    // With several 場次 open on one device, a report that only says "前後測" is
    // a report nobody can check.
    coverage: '涵蓋場次',
    coveragePhase: (phase, date, n) => `${phase} ${date}（出席 ${n} 人）`,
    coverageNotHeld: (phase) => `${phase} 未進行`,
    generatedFrom: '產生自',
    generatedFromValue: (phase, date) => `${phase} ${date}`,
    unitSeconds: '秒',
    notRecorded: '未記錄',
    notComparable: '不可比較',
    summaryAssessed: '完成量測人數',
    summaryProtocolValid: '符合測驗規範人數',
    summaryAttendance: '本期出席人數',

    // ── Regulatory surface. Not boilerplate. ──────────────────────────────
    // Per the invariant 3 amendment: the instrument reports a measured time to
    // a human. It does not apply the 14-second threshold, does not grade, and
    // does not state a determination. Do not edit casually.
    footerScope:
      '本表僅記錄受測者完成五次起立坐下所需之時間，由現場工作人員操作器材並確認紀錄。本器材不進行判讀、不提供分級、不作成任何評估、篩檢或轉介結論。是否符合各項標準，由具資格之人員依相關規定判定。',
    // Why a difference is sometimes withheld. Without this the blank cell looks
    // like missing data rather than a deliberate refusal to compare.
    footerComparable:
      '差值僅在前後測皆符合測驗規範且完成次數相同時計算；完成次數不同者標示「不可比較」，因不同次數之時間無法直接相減。',
    footerHandContact:
      '標示「手部支撐」者，表示過程中偵測到手部支撐，未符合雙手抱胸之測驗規範，該次時間僅供現場參考。標示「無法進行」者為有效紀錄結果。',
    footerPrivacy:
      '本器材不錄影、不儲存影像。攝影機僅即時計算人體關節位置，影像不留存、不傳輸。紀錄僅含代號，不含姓名或身分資料。',

    signFacilitator: '現場工作人員簽名',
    signLead: '單位負責人簽名',
    print: '列印',
    close: '關閉',
    aside: (inner) => `（${inner}）`,
  },

  scenario: {
    title: '示範情境',
    hint: '按 S 開啟或關閉。此面板僅存在於示範版本。',
    close: '關閉',
    groupSessions: '切換場次',
    groupTrial: '量測過程',
    groupEdge: '各種結果',
    groupSheet: '報表',
    sessionList: '場次清單',
    sheetMixed: '報表 · 混合結果',
    trials: {
      complete_typical: '典型完成',
      complete_slow: '較慢完成',
      incomplete_three: '只完成三次',
      hand_contact: '手部支撐',
      void_midway: '追蹤中斷後重測',
    },
    results: {
      complete: '完成五次',
      incomplete: '未完成五次',
      hand_contact: '手部支撐',
      unable: '無法進行',
      aborted: '已作廢',
    },
  },
}

export const strings: Strings = zhTW

/** Locale tag for `Intl` and the `lang` attribute. */
export const locale = 'zh-TW'
