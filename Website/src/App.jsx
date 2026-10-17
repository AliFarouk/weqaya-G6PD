import React, { useState, useEffect } from 'react';

const INITIAL_ITEMS = [
  { id: 1, name: 'طعمية / فلافل سخنة', category: 'food', hemolysis_votes: 1391, safe_votes: 29, total_votes: 1420 },
  { id: 2, name: 'فول مدمس بالزيت والحار', category: 'food', hemolysis_votes: 1871, safe_votes: 19, total_votes: 1890 },
  { id: 3, name: 'لانشون حلواني إخوان بقري', category: 'food', hemolysis_votes: 299, safe_votes: 116, total_votes: 415 },
  { id: 4, name: 'أقراص ريفو 320 مجم (أسبيرين أخضر)', category: 'medication', hemolysis_votes: 572, safe_votes: 78, total_votes: 650 },
  { id: 5, name: 'أقراص سبتازول / ستريم (سلفا)', category: 'medication', hemolysis_votes: 812, safe_votes: 8, total_votes: 820 },
  { id: 6, name: 'بسكويت ويفر كتاكيتو', category: 'food', hemolysis_votes: 150, safe_votes: 80, total_votes: 230 },
  { id: 7, name: 'أقراص بنادول أزرق (باراسيتامول)', category: 'medication', hemolysis_votes: 31, safe_votes: 1509, total_votes: 1540 },
  { id: 8, name: 'شيبسي بطعم الجبنة المتبلة', category: 'food', hemolysis_votes: 124, safe_votes: 186, total_votes: 310 },
  { id: 9, name: 'فيتامين سي فوار 1000 مجم (جرعات عالية)', category: 'medication', hemolysis_votes: 394, safe_votes: 86, total_votes: 480 },
  { id: 10, name: 'حمص الشام (حلبسة)', category: 'food', hemolysis_votes: 34, safe_votes: 306, total_votes: 340 },
  { id: 11, name: 'شوكولاتة كادبوري بابلي', category: 'food', hemolysis_votes: 45, safe_votes: 135, total_votes: 180 },
  { id: 12, name: 'كتافلام 50 مجم أقراص', category: 'medication', hemolysis_votes: 21, safe_votes: 389, total_votes: 410 }
];

export default function App() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('weqaya_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('weqaya_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [userVotes, setUserVotes] = useState(() => {
    const saved = localStorage.getItem('weqaya_votes');
    return saved ? JSON.parse(saved) : {};
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pendingVote, setPendingVote] = useState(null);

  const [authMode, setAuthMode] = useState('login');
  const [authName, setAuthName] = useState('');
  const [authPhoneOrEmail, setAuthPhoneOrEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authIsDoctor, setAuthIsDoctor] = useState(false);

  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('food');

  useEffect(() => {
    localStorage.setItem('weqaya_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('weqaya_votes', JSON.stringify(userVotes));
  }, [userVotes]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('weqaya_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('weqaya_current_user');
    }
  }, [currentUser]);

  const handleVote = (itemId, voteType) => {
    if (!currentUser) {
      setPendingVote({ itemId, voteType });
      setIsAuthModalOpen(true);
      return;
    }

    const voteKey = `${currentUser.id}_${itemId}`;
    const previousVote = userVotes[voteKey];

    if (previousVote === voteType) {
      alert('لقد سجلت هذا التصويت بالفعل لهذا الصنف.');
      return;
    }

    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          let hVotes = item.hemolysis_votes;
          let sVotes = item.safe_votes;
          let tVotes = item.total_votes;

          if (previousVote === 'hemolysis') {
            hVotes -= 1;
          } else if (previousVote === 'safe') {
            sVotes -= 1;
          } else {
            tVotes += 1;
          }

          if (voteType === 'hemolysis') {
            hVotes += 1;
          } else {
            sVotes += 1;
          }

          return {
            ...item,
            hemolysis_votes: hVotes,
            safe_votes: sVotes,
            total_votes: tVotes
          };
        }
        return item;
      })
    );

    setUserVotes(prev => ({ ...prev, [voteKey]: voteType }));
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (!authPhoneOrEmail.trim() || !authPassword.trim()) {
      alert('برجاء ملء جميع الحقول المطلوبة');
      return;
    }

    const user = {
      id: Date.now(),
      name: authMode === 'register' ? (authName || 'مستخدم جديد') : authPhoneOrEmail.split('@')[0],
      emailOrPhone: authPhoneOrEmail,
      isDoctor: authIsDoctor
    };

    setCurrentUser(user);
    setIsAuthModalOpen(false);

    if (pendingVote) {
      const voteKey = `${user.id}_${pendingVote.itemId}`;
      setItems(prev =>
        prev.map(item => {
          if (item.id === pendingVote.itemId) {
            return {
              ...item,
              hemolysis_votes: pendingVote.voteType === 'hemolysis' ? item.hemolysis_votes + 1 : item.hemolysis_votes,
              safe_votes: pendingVote.voteType === 'safe' ? item.safe_votes + 1 : item.safe_votes,
              total_votes: item.total_votes + 1
            };
          }
          return item;
        })
      );
      setUserVotes(prev => ({ ...prev, [voteKey]: pendingVote.voteType }));
      setPendingVote(null);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      alert('يرجى كتابة اسم الصنف التجاري');
      return;
    }

    const newItem = {
      id: Date.now(),
      name: newItemName.trim(),
      category: newItemCategory,
      hemolysis_votes: 0,
      safe_votes: 0,
      total_votes: 0
    };

    setItems([newItem, ...items]);
    setNewItemName('');
    setIsAddModalOpen(false);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (categoryFilter === 'food') return item.category === 'food';
    if (categoryFilter === 'medication') return item.category === 'medication';
    if (categoryFilter === 'danger') {
      const hPct = item.total_votes > 0 ? (item.hemolysis_votes / item.total_votes) * 100 : 0;
      return hPct >= 50;
    }
    if (categoryFilter === 'safe') {
      const sPct = item.total_votes > 0 ? (item.safe_votes / item.total_votes) * 100 : 0;
      return sPct > 50;
    }
    return true;
  });

  return (
    <div>
      <header>
        <div className="header-container">
          <a href="#" className="brand">
            <div className="brand-logo">و</div>
            <div className="brand-text">
              <h1>وقاية | Weqaya G6PD</h1>
              <p>دليل أنيميا الفول السريع</p>
            </div>
          </a>

          <div className="header-actions">
            {currentUser ? (
              <>
                <div className="user-badge">
                  <span>👤 {currentUser.name} {currentUser.isDoctor && '🩺 (طبيب)'}</span>
                </div>
                <button className="btn btn-add" onClick={() => setIsAddModalOpen(true)}>
                  ➕ أضف أكلة أو دواء
                </button>
                <button className="btn btn-outline" onClick={() => setCurrentUser(null)} title="تسجيل خروج">
                  خروج
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => { setPendingVote(null); setIsAuthModalOpen(true); }}>
                تسجيل الدخول / حساب جديد
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="hero">
        <h2 className="hero-title">هل الأكلة دي بتعمل تكسير للدم؟</h2>
        <p className="hero-subtitle">ابحث باسم الأكلة أو الدواء التجاري الشائع وشوف تجارب وتقييم الناس فوراً</p>

        <div className="search-bar-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="اكتب اسم الأكلة أو الدواء (مثلاً: لانشون حلواني، طعمية، ريفو، كتاكيتو)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        <div className="filter-pills">
          <button className={`pill ${categoryFilter === 'all' ? 'active' : ''}`} onClick={() => setCategoryFilter('all')}>
            الكل ({items.length})
          </button>
          <button className={`pill ${categoryFilter === 'food' ? 'active' : ''}`} onClick={() => setCategoryFilter('food')}>
            أكلات 🍔
          </button>
          <button className={`pill ${categoryFilter === 'medication' ? 'active' : ''}`} onClick={() => setCategoryFilter('medication')}>
            أدوية 💊
          </button>
          <button className={`pill ${categoryFilter === 'danger' ? 'active' : ''}`} onClick={() => setCategoryFilter('danger')}>
            تكسير عالي ⚠️
          </button>
          <button className={`pill ${categoryFilter === 'safe' ? 'active' : ''}`} onClick={() => setCategoryFilter('safe')}>
            آمنة شائعة ✅
          </button>
        </div>
      </section>

      <main className="main-container">
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <span>🔍</span>
            <h3>لم نجد أي نتائج لـ "{searchQuery}"</h3>
            <p>تقدر تضيف الصنف ده دلوقتي بنفسك والناس تبدأ تفوت عليه!</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => {
                setNewItemName(searchQuery);
                setIsAddModalOpen(true);
              }}
            >
              ➕ إضافة "{searchQuery}" كصنف جديد
            </button>
          </div>
        ) : (
          <div className="feed-grid">
            {filteredItems.map(item => {
              const hPct = item.total_votes > 0 ? Math.round((item.hemolysis_votes / item.total_votes) * 100) : 0;
              const sPct = item.total_votes > 0 ? Math.round((item.safe_votes / item.total_votes) * 100) : 0;
              const userVote = currentUser ? userVotes[`${currentUser.id}_${item.id}`] : null;

              return (
                <div key={item.id} className="item-card">
                  <div>
                    <div className="item-header">
                      <h3 className="item-name">{item.name}</h3>
                      <span className={`category-badge ${item.category}`}>
                        {item.category === 'food' ? 'أكل 🍔' : 'دواء 💊'}
                      </span>
                    </div>

                    <div className="progress-section">
                      <div className="progress-stats-labels">
                        <span className="stat-hemolysis">
                          {hPct}% حصل تكسير
                        </span>
                        <span className="stat-safe">
                          {sPct}% آمن معي
                        </span>
                      </div>

                      <div className="progress-track">
                        {item.total_votes === 0 ? (
                          <div style={{ width: '100%', height: '100%', background: '#CBD5E1' }}></div>
                        ) : (
                          <>
                            <div className="progress-fill-hemolysis" style={{ width: `${hPct}%` }}></div>
                            <div className="progress-fill-safe" style={{ width: `${sPct}%` }}></div>
                          </>
                        )}
                      </div>

                      <div className="voters-count">
                        {item.total_votes === 0 ? 'لا توجد أصوات بعد - كن أول من يصوّت' : `إجمالي الأصوات: ${item.total_votes.toLocaleString('ar-EG')} مشارك`}
                      </div>
                    </div>
                  </div>

                  <div className="vote-buttons">
                    <button
                      className={`btn-vote-danger ${userVote === 'hemolysis' ? 'voted' : ''}`}
                      onClick={() => handleVote(item.id, 'hemolysis')}
                    >
                      حصل تكسير ⚠️
                    </button>
                    <button
                      className={`btn-vote-safe ${userVote === 'safe' ? 'voted' : ''}`}
                      onClick={() => handleVote(item.id, 'safe')}
                    >
                      آمن معي ✅
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer>
        <p>تنبيه: منصة (وقاية) مبنية على تجارب وتصويتات مجتمعية استرشادية، ولا تغني عن استشارة الطبيب المختص.</p>
      </footer>

      {isAuthModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsAuthModalOpen(false)}>✕</button>
            <h3 className="modal-title">
              {authMode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </h3>
            <p className="modal-subtitle">
              لازم تعمل تسجيل دخول عشان تصوت وتشارك تجربتك وتفيد بقية الأهالي!
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                className={`btn ${authMode === 'login' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
                onClick={() => setAuthMode('login')}
              >
                دخول
              </button>
              <button
                className={`btn ${authMode === 'register' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1 }}
                onClick={() => setAuthMode('register')}
              >
                حساب جديد
              </button>
            </div>

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <div className="form-group">
                  <label className="form-label">الاسم أو اللقب</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: أم أحمد"
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">رقم الموبايل أو البريد الإلكتروني</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="010XXXXXXXX أو بريدك الإلكتروني"
                  value={authPhoneOrEmail}
                  onChange={e => setAuthPhoneOrEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">كلمة المرور</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  required
                />
              </div>

              {authMode === 'register' && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="isDoc"
                    checked={authIsDoctor}
                    onChange={e => setAuthIsDoctor(e.target.checked)}
                  />
                  <label htmlFor="isDoc" style={{ fontSize: 13, cursor: 'pointer' }}>
                    أنا طبيب / صيدلي أخصائي
                  </label>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
                {authMode === 'login' ? 'تسجيل الدخول والتصويت' : 'إنشاء الحساب والتصويت'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>✕</button>
            <h3 className="modal-title">➕ أضف أكلة أو دواء جديد</h3>
            <p className="modal-subtitle">اكتب اسم الصنف الشائع في السوق علشان الناس تقدر تسيرش عليه وتصوت</p>

            <form onSubmit={handleAddItem}>
              <div className="form-group">
                <label className="form-label">الاسم التجاري أو الشائع</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: شيبسي بالليمون، كفتة مصنعة، بارامول..."
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">القسم</label>
                <select
                  className="form-select"
                  value={newItemCategory}
                  onChange={e => setNewItemCategory(e.target.value)}
                >
                  <option value="food">أكل وسناكس 🍔</option>
                  <option value="medication">دواء ومسكن 💊</option>
                </select>
              </div>

              <button type="submit" className="btn btn-add" style={{ width: '100%', marginTop: 8 }}>
                إضافة للقائمة فوراً
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
