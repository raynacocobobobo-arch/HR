const pageDetails = {
  工作台: {
    title: "经营与执行总览",
    purpose: "把最需要你处理的异常集中到第一屏，避免每天逐个项目翻找问题。",
    features: ["冲突、逾期和超预算提醒", "今日执行与未来七天节点", "关键岗位产能预警"],
    principle: "系统按影响程度给异常排序；没有异常的项目只保留汇总，不占用你的注意力。",
    source: "OpenProject 的项目与工作包，加上 HRPM 插件中的档期、工时和成本快照。",
    human: "系统只提示问题和影响范围；延期、换人、加预算等决定仍由你作出。",
  },
  项目: {
    title: "项目全生命周期",
    purpose: "让每个视频项目都按相同的七阶段推进，并在关键节点避免漏项。",
    features: ["七阶段门与检查清单", "任务、负责人和交付节点", "基准成本与当前预测"],
    principle: "OpenProject 保存项目和工作包；HRPM 插件补充视频制作阶段、资源需求和阶段门。",
    source: "OpenProject 项目、工作包、文件和状态，以及 HRPM 的阶段检查与成本快照。",
    human: "只有你确认检查项齐全，项目才能跨过阶段门；系统不会自动关闭阶段。",
  },
  人员: {
    title: "人员、能力与产能",
    purpose: "回答谁会做、什么时候有空、安排后的负荷和成本是多少。",
    features: ["岗位与技能等级", "人员档期与本周负荷", "历史费率快照"],
    principle: "人员能力、可用时间和项目安排分别保存，调度时组合计算，不把员工简化成一个名字。",
    source: "HRPM 插件中的人员、技能、可用时间和费率；项目安排引用 OpenProject 工作包。",
    human: "技能等级、费率和人员可用性由你维护；算法不能自行修改个人资料。",
  },
  档期: {
    title: "智能排期与人工调度",
    purpose: "在不违反人员、场地、移动和休息约束的前提下，找到更合理的执行方案。",
    features: ["调整前后并排比较", "冲突与调整原因解释", "人工排期始终可用"],
    principle: "Timefold 读取一份排期快照并计算建议，不直接访问数据库；人工确认整套方案后，HRPM 才一次性写入。",
    source: "OpenProject 工作包与截止日期，以及 HRPM 的人员、地点、移动时间和排期规则。",
    human: "必须整套应用或整套退回重算。最终落地需要人工确认，Timefold 不能私自改档期。",
  },
  工时: {
    title: "计划工时与实际回填",
    purpose: "看清每个工作包实际用了多少时间，以及为什么偏离原计划。",
    features: ["计划与实际工时对照", "异常记录待确认", "偏差原因沉淀"],
    principle: "排期生成计划工时，执行后回填实际工时；差异同步进入成本预测和项目复盘。",
    source: "OpenProject 工作包、HRPM 排期记录和人工填写的实际工时。",
    human: "异常工时必须由你确认；系统不会因为一次超时就自动修改人员费率或模板。",
  },
  成本: {
    title: "项目成本三线控制",
    purpose: "同时查看计划成本、实际成本和完工预测，提前发现可能亏损的项目。",
    features: ["基准、实际、预测三线", "人员费率历史快照", "成本偏差来源解释"],
    principle: "OpenProject 提供项目与任务进度；HRPM 根据已确认费率、实际工时和剩余计划滚动计算完工预测。",
    source: "OpenProject 项目进度与工作包，加上 HRPM 的费率快照、工时、差旅及外采成本。",
    human: "预算调整和费率变更必须由你确认；预测只作为经营判断依据，不自动改合同。",
  },
  报表: {
    title: "项目与经营复盘",
    purpose: "从项目组合角度判断交付、产能和成本是否健康，并形成可复用经验。",
    features: ["项目健康矩阵", "交付与利用率指标", "月度复盘结论"],
    principle: "报表读取已经确认的业务事实，不另建影子台账；复盘结论可以形成模板改进建议。",
    source: "OpenProject 项目与任务历史，以及 HRPM 的排期、工时、成本、阶段门和审计记录。",
    human: "系统可以总结规律，但只有你确认后，经验才会进入模板或排期规则。",
  },
  模板与设置: {
    title: "模板、规则与经验",
    purpose: "把重复项目的成熟做法保存下来，同时控制排期规则和系统边界。",
    features: ["视频项目模板", "排期与休息规则", "历史经验改进建议"],
    principle: "关闭项目时生成复盘数据；系统只提出模板调整建议，不会悄悄改变未来项目。",
    source: "已关闭项目的阶段、工时、成本和修改轮次，以及你维护的公司排期政策。",
    human: "所有模板调整、规则变化都需要显式确认；可以忽略建议并继续使用原规则。",
  },
};

const navigation = [...document.querySelectorAll("[data-nav]")];
const views = [...document.querySelectorAll("[data-view]")];
const toast = document.querySelector('[role="status"]');
let toastTimer;

function renderExplanation(label) {
  const detail = pageDetails[label];
  document.querySelector("#explain-object").textContent = label;
  document.querySelector("#explain-purpose").textContent = detail.purpose;
  document.querySelector("#explain-principle").textContent = detail.principle;
  document.querySelector("#explain-source").textContent = detail.source;
  document.querySelector("#explain-human").textContent = detail.human;
  document.querySelector("#explain-features").replaceChildren(
    ...detail.features.map((feature) => {
      const item = document.createElement("li");
      item.textContent = feature;
      return item;
    }),
  );
}

function selectPage(label, updateHash = true) {
  const detail = pageDetails[label];
  if (!detail) return;

  navigation.forEach((button) => {
    if (button.textContent.trim() === label) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
  views.forEach((view) => {
    view.hidden = view.dataset.view !== label;
  });
  document.querySelector("#current-object").textContent = label;
  document.querySelector("#page-title").textContent = detail.title;
  renderExplanation(label);

  if (updateHash) {
    history.replaceState(null, "", `#${encodeURIComponent(label)}`);
  }
  window.scrollTo({ top: 0, behavior: "instant" });
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2800);
}

navigation.forEach((button) => {
  button.addEventListener("click", () => selectPage(button.textContent.trim()));
});

document.querySelector("#apply-schedule").addEventListener("click", (event) => {
  event.currentTarget.textContent = "✓ 方案已应用";
  event.currentTarget.disabled = true;
  document.querySelector('[data-schedule="after"]').classList.add("applied");
  showToast("方案已应用 · 已生成审计记录");
});

document.querySelectorAll("button:not([data-nav]):not(#apply-schedule):not(:disabled)").forEach((button) => {
  button.addEventListener("click", () => {
    showToast("演示操作 · 正式版会进入对应流程");
  });
});

const initialHash = decodeURIComponent(window.location.hash.slice(1));
selectPage(pageDetails[initialHash] ? initialHash : "工作台", false);
