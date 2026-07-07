import { useState, useEffect } from "react";

// ── 色パレット(ボタニカル・インテリア調)──────────────────
const C = {
  ink: "#2C3A2E",      // 深いグリーン墨色
  leaf: "#4C7A5A",     // メイングリーン
  moss: "#7FA487",     // 淡いグリーン
  mist: "#E4EBE2",     // ごく淡い緑がかった面
  paper: "#F7F6F0",    // 背景(やわらかい生成り)
  soil: "#A9805B",     // 鉢・木のアクセント
  alert: "#C96A5B",    // 使いすぎ警告
  sun: "#E0B14F",      // 達成ゴールド
  gray: "#8A9088",
};

const CATS = [
  { id: "food", label: "食費", emoji: "🍚" },
  { id: "daily", label: "日用品", emoji: "🧺" },
  { id: "fun", label: "趣味・ゴルフ", emoji: "⛳" },
  { id: "health", label: "健康・美容", emoji: "💊" },
  { id: "other", label: "その他", emoji: "🌿" },
];

const STORE_KEY = "yukorin-kakeibo-v1";

const yen = (n) =>
  "¥" + Math.round(n).toLocaleString("ja-JP");

const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

// ── 観葉植物SVG(防衛資金の成長で5段階)────────────────────
function PlantSvg({ stage }) {
  // stage: 0(種) 1(芽) 2(若葉) 3(育ち中) 4(立派) 5(満開の株)
  const leafColor = C.leaf;
  const stemColor = "#5E7C52";
  return (
    <svg viewBox="0 0 200 220" className="w-44 h-48 mx-auto" aria-label="防衛資金の成長を表す観葉植物">
      {/* 鉢 */}
      <path d="M60 165 L140 165 L130 210 L70 210 Z" fill={C.soil} />
      <rect x="54" y="158" width="92" height="12" rx="6" fill="#8F6A49" />
      {/* 土 */}
      <ellipse cx="100" cy="162" rx="38" ry="6" fill="#5C4632" />
      {stage >= 1 && (
        <g>
          <path d="M100 160 C100 140 100 130 100 118" stroke={stemColor} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M100 130 C88 124 80 112 82 100 C94 104 101 114 100 130" fill={leafColor} />
        </g>
      )}
      {stage >= 2 && (
        <path d="M100 138 C112 132 122 122 121 108 C108 112 100 122 100 138" fill={C.moss} />
      )}
      {stage >= 3 && (
        <g>
          <path d="M100 118 C100 100 100 92 100 82" stroke={stemColor} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M100 100 C84 94 72 80 76 64 C92 70 101 84 100 100" fill={leafColor} />
          <path d="M100 106 C116 100 128 88 126 72 C110 77 100 90 100 106" fill={leafColor} />
        </g>
      )}
      {stage >= 4 && (
        <g>
          <path d="M100 82 C100 68 100 62 100 54" stroke={stemColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M100 70 C82 62 70 46 76 30 C94 38 102 54 100 70" fill={C.moss} />
          <path d="M100 74 C118 66 132 52 128 34 C110 41 99 57 100 74" fill={C.moss} />
        </g>
      )}
      {stage >= 5 && (
        <g>
          <path d="M100 54 C96 42 96 34 98 26" stroke={stemColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <ellipse cx="98" cy="22" rx="12" ry="9" fill={C.sun} />
          <ellipse cx="98" cy="22" rx="5" ry="4" fill="#F4D98A" />
          <path d="M100 60 C86 56 78 46 80 36 C92 42 99 50 100 60" fill={leafColor} />
        </g>
      )}
      {stage === 0 && (
        <ellipse cx="100" cy="156" rx="7" ry="5" fill="#D8C49A" />
      )}
    </svg>
  );
}

// ── メインアプリ ──────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState({
    income: 0,     // 手取り月収
    fixed: 0,      // 固定費合計
    savings: 0,    // 先取り貯蓄
    fundGoal: 0,   // 防衛資金の目標(0なら自動計算)
  });
  const [fund, setFund] = useState(0); // 生活防衛資金の現在額
  const [expenses, setExpenses] = useState({}); // { "2026-07": [ {id,d,amt,cat} ] }
  const [showSetup, setShowSetup] = useState(false);

  // 読み込み
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORE_KEY);
        if (r && r.value) {
          const d = JSON.parse(r.value);
          setSettings(d.settings || settings);
          setFund(d.fund || 0);
          setExpenses(d.expenses || {});
          if (!d.settings || !d.settings.income) setShowSetup(true);
        } else {
          setShowSetup(true);
        }
      } catch (e) {
        setShowSetup(true);
      }
      setLoaded(true);
    })();
  }, []);

  // 保存
  const persist = async (next) => {
    try {
      await window.storage.set(
        STORE_KEY,
        JSON.stringify({
          settings: next.settings ?? settings,
          fund: next.fund ?? fund,
          expenses: next.expenses ?? expenses,
        })
      );
    } catch (e) {
      console.error("保存に失敗しました", e);
    }
  };

  const mk = monthKey();
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const day = now.getDate();

  const monthExpenses = expenses[mk] || [];
  const spent = monthExpenses.reduce((s, e) => s + e.amt, 0);
  const budget = Math.max(settings.income - settings.fixed - settings.savings, 0);
  const remaining = budget - spent;
  const idealSpent = budget * (day / daysInMonth);
  const paceDiff = idealSpent - spent; // プラスなら余裕あり
  const remainingDays = daysInMonth - day + 1;
  const perDay = remaining > 0 ? remaining / remainingDays : 0;

  const monthlyLiving = settings.fixed + budget;
  const fundGoal = settings.fundGoal > 0 ? settings.fundGoal : monthlyLiving * 6;
  const fundRatio = fundGoal > 0 ? Math.min(fund / fundGoal, 1) : 0;
  const stage = fund <= 0 ? 0 : fundRatio >= 1 ? 5 : fundRatio >= 0.66 ? 4 : fundRatio >= 0.4 ? 3 : fundRatio >= 0.16 ? 2 : 1;
  const fundMonths = monthlyLiving > 0 ? fund / monthlyLiving : 0;

  // ── 支出の追加/削除 ──
  const addExpense = (amt, cat) => {
    const item = { id: Date.now(), d: now.getDate(), amt, cat };
    const next = { ...expenses, [mk]: [...monthExpenses, item] };
    setExpenses(next);
    persist({ expenses: next });
  };
  const removeExpense = (id) => {
    const next = { ...expenses, [mk]: monthExpenses.filter((e) => e.id !== id) };
    setExpenses(next);
    persist({ expenses: next });
  };
  const addFund = (amt) => {
    const next = fund + amt;
    setFund(next);
    persist({ fund: next });
  };

  if (!loaded)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.paper, color: C.gray }}>
        読み込み中…
      </div>
    );

  return (
    <div className="min-h-screen pb-24" style={{ background: C.paper, color: C.ink, fontFamily: "'Zen Maru Gothic','Hiragino Maru Gothic ProN','Hiragino Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&display=swap');`}</style>

      {/* ヘッダー */}
      <header className="max-w-md mx-auto px-5 pt-6 pb-2 flex items-baseline justify-between">
        <h1 className="text-lg font-bold tracking-wide" style={{ color: C.leaf }}>
          🪴 そだつ家計簿
        </h1>
        <span className="text-xs" style={{ color: C.gray }}>
          {now.getFullYear()}年{now.getMonth() + 1}月{day}日
        </span>
      </header>

      <main className="max-w-md mx-auto px-5">
        {showSetup || tab === "settings" ? (
          <SettingsScreen
            settings={settings}
            fund={fund}
            onSave={(s, f) => {
              setSettings(s);
              setFund(f);
              persist({ settings: s, fund: f });
              setShowSetup(false);
              setTab("home");
            }}
            firstTime={showSetup}
          />
        ) : tab === "home" ? (
          <HomeScreen
            budget={budget}
            spent={spent}
            remaining={remaining}
            paceDiff={paceDiff}
            perDay={perDay}
            remainingDays={remainingDays}
            addExpense={addExpense}
          />
        ) : tab === "list" ? (
          <ListScreen monthExpenses={monthExpenses} removeExpense={removeExpense} spent={spent} />
        ) : (
          <FundScreen fund={fund} fundGoal={fundGoal} fundMonths={fundMonths} stage={stage} addFund={addFund} remaining={remaining} />
        )}
      </main>

      {/* 下部ナビ */}
      {!showSetup && (
        <nav className="fixed bottom-0 left-0 right-0" style={{ background: "#FFFFFF", borderTop: `1px solid ${C.mist}` }}>
          <div className="max-w-md mx-auto flex">
            {[
              { id: "home", label: "きょう", icon: "☀️" },
              { id: "list", label: "きろく", icon: "📝" },
              { id: "fund", label: "そだてる", icon: "🌱" },
              { id: "settings", label: "せってい", icon: "⚙️" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 py-3 text-center text-xs font-medium"
                style={{ color: tab === t.id ? C.leaf : C.gray }}
              >
                <div className="text-base">{t.icon}</div>
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

// ── ホーム(見える化+かんたん入力)──────────────────────
function HomeScreen({ budget, spent, remaining, paceDiff, perDay, remainingDays, addExpense }) {
  const [amt, setAmt] = useState("");
  const [cat, setCat] = useState("food");
  const [flash, setFlash] = useState(false);

  const good = paceDiff >= 0;
  const ratio = budget > 0 ? Math.min(spent / budget, 1) : 0;

  const submit = () => {
    const n = parseInt(amt, 10);
    if (!n || n <= 0) return;
    addExpense(n, cat);
    setAmt("");
    setFlash(true);
    setTimeout(() => setFlash(false), 1200);
  };

  return (
    <div className="space-y-4 mt-2">
      {/* 主役カード:あと使える額 */}
      <section className="rounded-3xl p-6 text-center shadow-sm" style={{ background: "#FFFFFF" }}>
        <p className="text-xs font-medium" style={{ color: C.gray }}>
          今月あと使えるお金
        </p>
        <p className="text-5xl font-bold mt-1 tracking-tight" style={{ color: remaining >= 0 ? C.ink : C.alert }}>
          {yen(remaining)}
        </p>
        <p className="text-xs mt-2" style={{ color: C.gray }}>
          1日あたり {yen(perDay)} × あと{remainingDays}日
        </p>

        {/* ペースゲージ */}
        <div className="mt-5">
          <div className="h-3 rounded-full overflow-hidden" style={{ background: C.mist }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${ratio * 100}%`, background: good ? C.leaf : C.alert }}
            />
          </div>
          <div className="flex justify-between text-[11px] mt-1" style={{ color: C.gray }}>
            <span>使った {yen(spent)}</span>
            <span>よさん {yen(budget)}</span>
          </div>
        </div>

        {/* ペース判定 */}
        <div
          className="mt-4 inline-block px-4 py-1.5 rounded-full text-sm font-bold"
          style={{
            background: good ? C.mist : "#F6E3DF",
            color: good ? C.leaf : C.alert,
          }}
        >
          {good
            ? `いいペース!理想より ${yen(paceDiff)} の余裕 ✨`
            : `理想ペースより ${yen(-paceDiff)} オーバー。ここから調整!`}
        </div>
      </section>

      {/* かんたん入力 */}
      <section className="rounded-3xl p-5 shadow-sm" style={{ background: "#FFFFFF" }}>
        <p className="text-sm font-bold mb-3" style={{ color: C.ink }}>
          つかった分を5秒で記録
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {CATS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                background: cat === c.id ? C.leaf : C.mist,
                color: cat === c.id ? "#FFFFFF" : C.ink,
              }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            placeholder="金額(円)"
            className="flex-1 rounded-2xl px-4 py-3 text-lg outline-none"
            style={{ background: C.paper, border: `1.5px solid ${C.mist}` }}
          />
          <button
            onClick={submit}
            className="px-6 rounded-2xl text-white font-bold text-base"
            style={{ background: C.leaf }}
          >
            記録
          </button>
        </div>
        {flash && (
          <p className="text-sm mt-2 font-medium" style={{ color: C.leaf }}>
            記録しました🌿 えらい!
          </p>
        )}
      </section>
    </div>
  );
}

// ── きろく(一覧)────────────────────────────────────────
function ListScreen({ monthExpenses, removeExpense, spent }) {
  const byCat = CATS.map((c) => ({
    ...c,
    total: monthExpenses.filter((e) => e.cat === c.id).reduce((s, e) => s + e.amt, 0),
  })).filter((c) => c.total > 0);

  return (
    <div className="space-y-4 mt-2">
      <section className="rounded-3xl p-5 shadow-sm" style={{ background: "#FFFFFF" }}>
        <p className="text-sm font-bold mb-3">今月の内訳(合計 {yen(spent)})</p>
        {byCat.length === 0 && (
          <p className="text-sm" style={{ color: C.gray }}>
            まだ記録がありません。「きょう」タブから記録してみましょう🌱
          </p>
        )}
        {byCat.map((c) => (
          <div key={c.id} className="flex items-center gap-3 py-1.5">
            <span className="text-sm w-28">{c.emoji} {c.label}</span>
            <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: C.mist }}>
              <div className="h-full rounded-full" style={{ width: `${spent > 0 ? (c.total / spent) * 100 : 0}%`, background: C.moss }} />
            </div>
            <span className="text-sm font-medium w-20 text-right">{yen(c.total)}</span>
          </div>
        ))}
      </section>

      <section className="rounded-3xl p-5 shadow-sm" style={{ background: "#FFFFFF" }}>
        <p className="text-sm font-bold mb-2">明細</p>
        {[...monthExpenses].reverse().map((e) => {
          const c = CATS.find((x) => x.id === e.cat) || CATS[4];
          return (
            <div key={e.id} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${C.mist}` }}>
              <span className="text-sm" style={{ color: C.gray }}>{e.d}日</span>
              <span className="text-sm flex-1 ml-3">{c.emoji} {c.label}</span>
              <span className="text-sm font-medium">{yen(e.amt)}</span>
              <button onClick={() => removeExpense(e.id)} className="ml-3 text-xs" style={{ color: C.alert }}>
                削除
              </button>
            </div>
          );
        })}
        {monthExpenses.length === 0 && (
          <p className="text-sm" style={{ color: C.gray }}>明細はまだありません。</p>
        )}
      </section>
    </div>
  );
}

// ── そだてる(生活防衛資金)──────────────────────────────
function FundScreen({ fund, fundGoal, fundMonths, stage, addFund, remaining }) {
  const [amt, setAmt] = useState("");
  const milestones = [
    { m: 1, label: "1ヶ月分" },
    { m: 3, label: "3ヶ月分" },
    { m: 6, label: "6ヶ月分" },
  ];

  return (
    <div className="space-y-4 mt-2">
      <section className="rounded-3xl p-6 text-center shadow-sm" style={{ background: "#FFFFFF" }}>
        <p className="text-xs font-medium" style={{ color: C.gray }}>生活防衛資金</p>
        <PlantSvg stage={stage} />
        <p className="text-3xl font-bold" style={{ color: C.leaf }}>{yen(fund)}</p>
        <p className="text-xs mt-1" style={{ color: C.gray }}>
          目標 {yen(fundGoal)}(生活費 約{fundMonths.toFixed(1)}ヶ月分 まで成長中)
        </p>

        <div className="mt-4 h-3 rounded-full overflow-hidden" style={{ background: C.mist }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((fund / fundGoal) * 100, 100)}%`, background: C.leaf }} />
        </div>
        <div className="flex justify-between mt-2">
          {milestones.map((ms) => {
            const reached = fundMonths >= ms.m;
            return (
              <span
                key={ms.m}
                className="text-[11px] px-2 py-1 rounded-full font-medium"
                style={{ background: reached ? C.sun : C.mist, color: reached ? "#7A5C13" : C.gray }}
              >
                {reached ? "🏅 " : ""}{ms.label}
              </span>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl p-5 shadow-sm" style={{ background: "#FFFFFF" }}>
        <p className="text-sm font-bold mb-1">水やり(貯蓄を追加)</p>
        <p className="text-xs mb-3" style={{ color: C.gray }}>
          月末に余ったお金やボーナスをここへ。今月の残り予算は {yen(Math.max(remaining, 0))} です。
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            placeholder="金額(円)"
            className="flex-1 rounded-2xl px-4 py-3 text-lg outline-none"
            style={{ background: C.paper, border: `1.5px solid ${C.mist}` }}
          />
          <button
            onClick={() => {
              const n = parseInt(amt, 10);
              if (!n || n === 0) return;
              addFund(n);
              setAmt("");
            }}
            className="px-6 rounded-2xl text-white font-bold"
            style={{ background: C.leaf }}
          >
            💧 追加
          </button>
        </div>
      </section>
    </div>
  );
}

// ── せってい ──────────────────────────────────────────────
function SettingsScreen({ settings, fund, onSave, firstTime }) {
  const [s, setS] = useState({ ...settings });
  const [f, setF] = useState(fund);

  const budget = Math.max((s.income || 0) - (s.fixed || 0) - (s.savings || 0), 0);

  const field = (label, key, hint) => (
    <label className="block mb-4">
      <span className="text-sm font-bold">{label}</span>
      {hint && <span className="block text-[11px] mb-1" style={{ color: C.gray }}>{hint}</span>}
      <input
        type="number"
        inputMode="numeric"
        value={s[key] || ""}
        onChange={(e) => setS({ ...s, [key]: parseInt(e.target.value, 10) || 0 })}
        placeholder="0"
        className="w-full mt-1 rounded-2xl px-4 py-3 text-lg outline-none"
        style={{ background: C.paper, border: `1.5px solid ${C.mist}` }}
      />
    </label>
  );

  return (
    <div className="mt-2">
      <section className="rounded-3xl p-6 shadow-sm" style={{ background: "#FFFFFF" }}>
        {firstTime && (
          <div className="mb-5">
            <p className="font-bold" style={{ color: C.leaf }}>はじめまして🪴</p>
            <p className="text-sm mt-1" style={{ color: C.gray }}>
              3つの数字を入れるだけで「今月使えるお金」が決まります。だいたいでOK、あとから直せます!
            </p>
          </div>
        )}
        {field("手取り月収", "income", "毎月の手取り額(ボーナスは含めない)")}
        {field("固定費の合計", "fixed", "家賃・保険・通信費・サブスクなど、毎月ほぼ同じ金額")}
        {field("先取り貯蓄", "savings", "給料日に最初によけておく金額(まずは無理のない額で)")}

        <div className="rounded-2xl p-4 text-center mb-4" style={{ background: C.mist }}>
          <p className="text-xs" style={{ color: C.gray }}>今月使えるお金(自動計算)</p>
          <p className="text-2xl font-bold" style={{ color: C.leaf }}>{yen(budget)}</p>
        </div>

        <label className="block mb-4">
          <span className="text-sm font-bold">生活防衛資金のいまの残高</span>
          <span className="block text-[11px] mb-1" style={{ color: C.gray }}>すでに貯めている分があれば入力(なければ0でOK)</span>
          <input
            type="number"
            inputMode="numeric"
            value={f || ""}
            onChange={(e) => setF(parseInt(e.target.value, 10) || 0)}
            placeholder="0"
            className="w-full mt-1 rounded-2xl px-4 py-3 text-lg outline-none"
            style={{ background: C.paper, border: `1.5px solid ${C.mist}` }}
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm font-bold">防衛資金の目標額(任意)</span>
          <span className="block text-[11px] mb-1" style={{ color: C.gray }}>空欄なら「生活費6ヶ月分」で自動設定します</span>
          <input
            type="number"
            inputMode="numeric"
            value={s.fundGoal || ""}
            onChange={(e) => setS({ ...s, fundGoal: parseInt(e.target.value, 10) || 0 })}
            placeholder="自動"
            className="w-full mt-1 rounded-2xl px-4 py-3 text-lg outline-none"
            style={{ background: C.paper, border: `1.5px solid ${C.mist}` }}
          />
        </label>

        <button
          onClick={() => onSave(s, f)}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-base"
          style={{ background: C.leaf }}
        >
          保存してはじめる
        </button>
      </section>
    </div>
  );
}
