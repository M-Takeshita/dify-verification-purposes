const currentPage = document.body.dataset.page;
const sidebar = document.querySelector("[data-sidebar]");
const appConfig = window.APP_CONFIG || {};
const difyIframe = document.querySelector("[data-dify-iframe]");

if (difyIframe && appConfig.DIFY_IFRAME_URL) {
  difyIframe.src = appConfig.DIFY_IFRAME_URL;
}

if (sidebar) {
  const navItems = [
    {
      id: "index",
      href: "./index.html",
      label: "チャットボット相談",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18.5V6.8C6 5.8 6.8 5 7.8 5h8.4C17.2 5 18 5.8 18 6.8v6.4c0 1-.8 1.8-1.8 1.8H10l-4 3.5ZM8.5 9.5h7M8.5 12.5h4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    },
    {
      id: "question",
      href: "./question.html",
      label: "ベテランへ質問する",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19h7M15.5 5.5a2.1 2.1 0 0 1 3 3L9 18l-4 1 1-4 9.5-9.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    },
    {
      id: "questions",
      href: "./questions.html",
      label: "質問一覧",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 6h10M7 11h10M7 16h6M5.5 6h.01M5.5 11h.01M5.5 16h.01" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    },
  ];

  const navMarkup = navItems
    .map(({ id, href, label, icon }) => {
      const activeClass = currentPage === id ? " active" : "";
      return `
        <a class="nav-link${activeClass}" href="${href}">
          <span class="nav-link-inner">
            <span class="nav-icon">${icon}</span>
            <span>${label}</span>
          </span>
        </a>
      `;
    })
    .join("");

  sidebar.innerHTML = `
    <div class="sidebar-top">
      <div class="brand">
        <div class="brand-mark">技</div>
        <div class="brand-copy">
          <p class="eyebrow">Knowledge Transfer System</p>
          <h1>ベテラン技術<br />ナレッジ継承<br />DEMO版</h1>
        </div>
      </div>
    </div>
    <nav class="nav">
      ${navMarkup}
      <a class="nav-link demo-link" href="#" data-open-drive>
        <span class="nav-link-inner">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7.5h6m-8.5 4h11m-11 4H13M5.8 4h12.4C19.2 4 20 4.8 20 5.8v12.4c0 1-.8 1.8-1.8 1.8H5.8C4.8 20 4 19.2 4 18.2V5.8C4 4.8 4.8 4 5.8 4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <span>[DEMO] チャットボットファイル連携</span>
        </span>
      </a>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="user-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 7a7 7 0 0 1 14 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="user-meta">
          <p class="user-label">ログインユーザー</p>
          <strong>山田 太郎</strong>
          <span>製造技術部 / DEMOユーザー</span>
        </div>
      </div>
      <div class="sidebar-note logout-note">
        <a class="logout-link" href="./index.html">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 7H6.8C5.8 7 5 7.8 5 8.8v6.4c0 1 .8 1.8 1.8 1.8H10m4-3 4-4m0 0-4-4m4 4H9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>ログアウト</span>
        </a>
      </div>
    </div>
  `;
}

const filterId = document.querySelector("[data-filter-id]");
const filterDate = document.querySelector("[data-filter-date]");
const filterStatus = document.querySelector("[data-filter-status]");
const filterCategory = document.querySelector("[data-filter-category]");
const filterMine = document.querySelector("[data-filter-mine]");
const countNote = document.querySelector("[data-count-note]");
const questionRows = document.querySelectorAll("tbody tr[data-status]");
const applyFiltersButton = document.querySelector("[data-apply-filters]");

if (questionRows.length > 0) {
  const totalCount = 3291;

  const applyQuestionFilters = () => {
    const idValue = (filterId?.value || "").trim().toLowerCase();
    const dateValue = filterDate?.value || "";
    const statusValue = filterStatus?.value || "all";
    const categoryValue = filterCategory?.value || "all";
    const mineOnly = Boolean(filterMine?.checked);
    let visibleCount = 0;

    questionRows.forEach((row) => {
      const matchesId = !idValue || row.dataset.id.toLowerCase().includes(idValue);
      const matchesDate = !dateValue || row.dataset.date === dateValue;
      const matchesStatus = statusValue === "all" || row.dataset.status === statusValue;
      const matchesCategory = categoryValue === "all" || row.dataset.category === categoryValue;
      const matchesMine = !mineOnly || row.children[5]?.textContent.trim() === "山田 太郎";
      const matches = matchesId && matchesDate && matchesStatus && matchesCategory && matchesMine;

      row.hidden = !matches;

      if (matches) {
        visibleCount += 1;
      }
    });

    if (countNote) {
      countNote.textContent =
        visibleCount > 0 ? `1-${visibleCount}件 / ${totalCount}件` : `0件 / ${totalCount}件`;
    }
  };

  applyQuestionFilters();

  if (applyFiltersButton) {
    applyFiltersButton.addEventListener("click", applyQuestionFilters);
  }
}

const driveModal = document.querySelector("[data-drive-modal]");
const driveOpeners = document.querySelectorAll("[data-open-drive]");
const driveCancel = document.querySelector("[data-drive-cancel]");
const driveConfirm = document.querySelector("[data-drive-confirm]");
const answerModal = document.querySelector("[data-answer-modal]");
const answerOpeners = document.querySelectorAll("[data-answer-open]");
const answerCancel = document.querySelector("[data-answer-cancel]");
const answerConfirm = document.querySelector("[data-answer-confirm]");
const detailModal = document.querySelector("[data-detail-modal]");
const detailOpeners = document.querySelectorAll("[data-detail-open]");
const detailClose = document.querySelector("[data-detail-close]");
const detailId = document.querySelector("[data-detail-id]");
const detailStatus = document.querySelector("[data-detail-status]");
const detailTitle = document.querySelector("[data-detail-title]");
const detailCategory = document.querySelector("[data-detail-category]");
const detailQuestion = document.querySelector("[data-detail-question]");
const detailReference = document.querySelector("[data-detail-reference]");
const detailFiles = document.querySelector("[data-detail-files]");
const detailAnswer = document.querySelector("[data-detail-answer]");
const detailAnswerRow = document.querySelector("[data-detail-answer-row]");
const followupModal = document.querySelector("[data-followup-modal]");
const followupOpen = document.querySelector("[data-followup-open]");
const followupCancel = document.querySelector("[data-followup-cancel]");
const followupConfirm = document.querySelector("[data-followup-confirm]");
const followupLoading = document.querySelector("[data-followup-loading]");
let answerTargetHref = "./answer.html";

if (driveModal && driveOpeners.length > 0) {
  const closeDriveModal = () => {
    driveModal.hidden = true;
  };

  driveOpeners.forEach((opener) => {
    opener.addEventListener("click", (event) => {
      event.preventDefault();
      driveModal.hidden = false;
    });
  });

  if (driveCancel) {
    driveCancel.addEventListener("click", closeDriveModal);
  }

  if (driveConfirm) {
    driveConfirm.addEventListener("click", () => {
      window.open("https://drive.google.com/drive/folders/1fDLfZDa9zUCheOAIPHx4eOKEhdZM9Xui?usp=drive_link", "_blank", "noopener");
      closeDriveModal();
    });
  }

  driveModal.addEventListener("click", (event) => {
    if (event.target === driveModal) {
      closeDriveModal();
    }
  });
}

if (answerModal && answerOpeners.length > 0) {
  const closeAnswerModal = () => {
    answerModal.hidden = true;
  };

  answerOpeners.forEach((opener) => {
    opener.addEventListener("click", (event) => {
      event.preventDefault();
      answerTargetHref = opener.getAttribute("href") || "./answer.html";
      answerModal.hidden = false;
    });
  });

  if (answerCancel) {
    answerCancel.addEventListener("click", closeAnswerModal);
  }

  if (answerConfirm) {
    answerConfirm.addEventListener("click", () => {
      window.location.href = answerTargetHref;
    });
  }

  answerModal.addEventListener("click", (event) => {
    if (event.target === answerModal) {
      closeAnswerModal();
    }
  });
}

if (detailModal && detailOpeners.length > 0) {
  const closeDetailModal = () => {
    detailModal.hidden = true;
  };

  detailOpeners.forEach((opener) => {
    opener.addEventListener("click", (event) => {
      event.preventDefault();
      detailId.textContent = opener.dataset.questionId || "";
      detailStatus.textContent = opener.dataset.questionStatus || "";
      detailTitle.textContent = opener.dataset.questionTitle || "";
      detailCategory.textContent = opener.dataset.questionCategory || "";
      detailQuestion.textContent = opener.dataset.questionDetail || "";
      detailReference.textContent = opener.dataset.questionReference || "";
      const files = (opener.dataset.questionFiles || "")
        .split(",")
        .map((file) => file.trim())
        .filter(Boolean);

      if (files.length > 0) {
        detailFiles.innerHTML = files
          .map((file) => `<a href="#">${file}</a>`)
          .join("");
      } else {
        detailFiles.textContent = "添付なし";
      }

      if (opener.dataset.questionAnswer) {
        detailAnswer.textContent = opener.dataset.questionAnswer;
        detailAnswerRow.hidden = false;
      } else {
        detailAnswer.textContent = "";
        detailAnswerRow.hidden = true;
      }

      detailModal.hidden = false;
    });
  });

  if (detailClose) {
    detailClose.addEventListener("click", closeDetailModal);
  }

  detailModal.addEventListener("click", (event) => {
    if (event.target === detailModal) {
      closeDetailModal();
    }
  });
}

if (followupModal && followupOpen) {
  const closeFollowupModal = () => {
    followupModal.hidden = true;
  };

  followupOpen.addEventListener("click", () => {
    if (followupLoading) {
      followupLoading.hidden = false;
      window.setTimeout(() => {
        followupLoading.hidden = true;
        followupModal.hidden = false;
      }, 4000);
      return;
    }

    followupModal.hidden = false;
  });

  if (followupCancel) {
    followupCancel.addEventListener("click", closeFollowupModal);
  }

  if (followupConfirm) {
    followupConfirm.addEventListener("click", () => {
      window.location.href = "./questions.html";
    });
  }

  followupModal.addEventListener("click", (event) => {
    if (event.target === followupModal) {
      closeFollowupModal();
    }
  });
}
