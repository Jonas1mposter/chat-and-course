export type Course = {
  id: string;
  title: string;
  description: string;
  instructor: string;
  level: "入门" | "进阶" | "高级";
  duration: string;
  lessons: number;
  students: number;
  category: string;
  emoji: string;
  lessonsList: { title: string; duration: string }[];
};

export type Post = {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  category: string;
  excerpt: string;
  content: string;
  replies: number;
  likes: number;
  createdAt: string;
  pinned?: boolean;
};

export type Reply = {
  id: string;
  postId: string;
  author: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
};

export const courses: Course[] = [
  {
    id: "react-foundations",
    title: "React 基础与工程实践",
    description: "从组件、状态到 Hooks，掌握现代 React 开发的核心思想。",
    instructor: "李雨晴",
    level: "入门",
    duration: "8 周",
    lessons: 24,
    students: 1280,
    category: "前端开发",
    emoji: "⚛️",
    lessonsList: [
      { title: "课程导览与环境搭建", duration: "12:30" },
      { title: "JSX 与组件思维", duration: "18:42" },
      { title: "Props 与组件通信", duration: "22:10" },
      { title: "useState 与状态管理", duration: "26:05" },
      { title: "useEffect 副作用", duration: "24:18" },
      { title: "自定义 Hooks", duration: "20:55" },
    ],
  },
  {
    id: "design-system",
    title: "设计系统从 0 到 1",
    description: "构建可扩展的设计语言，让团队协作更高效、产品体验更一致。",
    instructor: "陈墨",
    level: "进阶",
    duration: "6 周",
    lessons: 18,
    students: 642,
    category: "产品设计",
    emoji: "🎨",
    lessonsList: [
      { title: "什么是设计系统", duration: "15:20" },
      { title: "Design Token 的搭建", duration: "21:00" },
      { title: "组件库的版本管理", duration: "19:33" },
      { title: "文档与协作流程", duration: "17:48" },
    ],
  },
  {
    id: "ai-product",
    title: "AI 产品设计与落地",
    description: "理解 LLM 能力边界，设计真正解决问题的 AI 产品。",
    instructor: "周南",
    level: "高级",
    duration: "10 周",
    lessons: 32,
    students: 2148,
    category: "AI 应用",
    emoji: "🤖",
    lessonsList: [
      { title: "LLM 的能力地图", duration: "28:00" },
      { title: "Prompt 工程实战", duration: "32:14" },
      { title: "RAG 检索增强生成", duration: "35:42" },
      { title: "Agent 设计模式", duration: "30:08" },
    ],
  },
  {
    id: "growth",
    title: "数据驱动的增长方法论",
    description: "用结构化方式拆解增长问题，构建可复用的实验体系。",
    instructor: "苏雅",
    level: "进阶",
    duration: "5 周",
    lessons: 15,
    students: 856,
    category: "运营增长",
    emoji: "📈",
    lessonsList: [
      { title: "增长模型 AARRR", duration: "20:00" },
      { title: "假设与实验设计", duration: "24:30" },
      { title: "数据分析框架", duration: "27:15" },
    ],
  },
];

export const posts: Post[] = [
  {
    id: "welcome",
    title: "👋 欢迎来到学社，请先看这条置顶",
    author: "社群管家",
    authorAvatar: "管",
    category: "公告",
    excerpt: "在这里你可以学习课程、参与讨论、结识同伴。先做个自我介绍吧～",
    content:
      "欢迎来到我们的学习社群！\n\n这里有三件事可以做：\n1. 在「课程」中学习系统化内容\n2. 在「讨论区」提问、分享、复盘\n3. 关注你感兴趣的同学，一起成长\n\n请大家保持友善、聚焦学习。Happy learning!",
    replies: 86,
    likes: 312,
    createdAt: "2 天前",
    pinned: true,
  },
  {
    id: "react-state",
    title: "useState 和 useReducer 到底什么时候用？",
    author: "林子川",
    authorAvatar: "林",
    category: "前端开发",
    excerpt: "学完 React 基础课后，我对状态拆分的边界还是有点模糊，想听听大家的实践经验……",
    content:
      "学完 React 基础课后，我对状态拆分的边界还是有点模糊。\n\n目前我的理解是：\n- 简单独立状态 → useState\n- 状态之间有耦合、转换复杂 → useReducer\n\n但实际写业务时还是会拿不准，比如表单到底多复杂才上 reducer？大家是怎么判断的？",
    replies: 24,
    likes: 58,
    createdAt: "5 小时前",
  },
  {
    id: "design-token",
    title: "我们团队是如何把 Design Token 接入研发流程的",
    author: "陈墨",
    authorAvatar: "陈",
    category: "产品设计",
    excerpt: "分享一下我们把 Figma Variables 同步到代码仓库的实操方案，踩了不少坑。",
    content:
      "上周完成了 Design Token 的工程化接入，简单复盘一下整个链路：\n\n1. Figma Variables 定义语义化 Token\n2. 通过 Tokens Studio 导出 JSON\n3. Style Dictionary 转换为各端可用产物\n4. CI 上自动同步到设计系统仓库\n\n最大的收获是：先达成共识，再做工具。",
    replies: 41,
    likes: 127,
    createdAt: "昨天",
  },
  {
    id: "ai-agent",
    title: "做了一个用 Agent 自动整理周报的小工具",
    author: "周南",
    authorAvatar: "周",
    category: "AI 应用",
    excerpt: "周末花了两天搭了个 Agent，从 GitHub、日历、Slack 抓数据自动生成周报草稿。",
    content:
      "灵感来自每周写周报的痛苦……\n\n实现思路：\n- 用 LangGraph 构建 Agent 流程\n- 每个数据源做成独立的 Tool\n- 最后用一个 Summary 节点合并\n\n第一版能用，但有几个问题想请教大家：如何让 Agent 在数据缺失时优雅降级？",
    replies: 18,
    likes: 94,
    createdAt: "3 天前",
  },
  {
    id: "growth-exp",
    title: "新人首单转化率提升 32% 的复盘",
    author: "苏雅",
    authorAvatar: "苏",
    category: "运营增长",
    excerpt: "三个月做了 17 个实验，分享一下我们认为最有价值的 3 个洞察。",
    content:
      "这一季度我们围绕新人首单转化做了 17 个实验，最终转化率从 8.4% 提升到 11.1%。\n\n三个核心洞察：\n1. 新人引导步骤越短越好，但要保留个性化\n2. 价格锚点比折扣力度更重要\n3. 首单后 7 天内的二次触达 ROI 最高",
    replies: 32,
    likes: 186,
    createdAt: "1 周前",
  },
];

export const replies: Reply[] = [
  {
    id: "r1",
    postId: "react-state",
    author: "李雨晴",
    authorAvatar: "李",
    content:
      "我的经验法则：当 setState 出现在 3 个以上不同位置，或者新状态依赖旧状态的逻辑超过两步，就考虑 reducer。",
    createdAt: "3 小时前",
    likes: 22,
  },
  {
    id: "r2",
    postId: "react-state",
    author: "Alex",
    authorAvatar: "A",
    content: "表单类场景我现在基本直接上 react-hook-form，不用纠结这个问题了哈哈。",
    createdAt: "2 小时前",
    likes: 14,
  },
  {
    id: "r3",
    postId: "welcome",
    author: "林子川",
    authorAvatar: "林",
    content: "前端开发，目前在做设计系统相关的工作，希望在这里多交流～",
    createdAt: "1 天前",
    likes: 8,
  },
];

export const categories = ["全部", "公告", "前端开发", "产品设计", "AI 应用", "运营增长"];