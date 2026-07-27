-- 为 ai-tutorial 课程每节课（第1-9课）插入5道摸底题
-- 使用课程 owner 作为出题人；kind='question'
DO $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT owner_id INTO v_owner FROM courses WHERE id='ai-tutorial';
  IF v_owner IS NULL THEN RAISE EXCEPTION '课程 ai-tutorial 不存在或没有 owner'; END IF;
  -- 先清掉此课程已有的 question 类评论，避免重复
  DELETE FROM lesson_comments WHERE course_id='ai-tutorial' AND kind='question';
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',0,v_owner,'question',E'【第1题】你双击 U 盘里的「合同.pdf」，Acrobat 一闪而过、没打开，桌面也没变化。最该做的是？
A. 重装一遍 Acrobat，多半是阅读器坏了才没能显示这个文件
B. 断网、开任务管理器看陌生进程和外连，再决定杀毒或重装
C. 换 WPS 或浏览器再打开一次，能打开就说明是兼容问题
D. 把文件名改成英文再重开一次，中文路径有时会让它打不开

✅ 正确答案：B
💡 解析：「开一下没反应」正是投放型木马最典型的表现——程序其实已经跑过了，UI 只是幌子。先断网、看进程，才有机会止损。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',0,v_owner,'question',E'【第2题】你写重要材料，Word 突然崩溃且没手动保存过。最像老手的做法是？
A. 立刻重开 Word 走恢复窗格，同时不要动 %AppData% 的 .asd
B. 先重启电脑释放内存，让 Word 下次启动时自动弹恢复窗格
C. 重开原文档凭记忆手动补一遍，反正内容刚写不久还记得
D. 关掉其它程序腾内存，再让 Word 重新加载文档试一次

✅ 正确答案：A
💡 解析：AutoRecover 的 .asd 只会在下一次 Word 正常启动时被拾取一次，重启电脑或动了缓存都可能永久丢失。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',0,v_owner,'question',E'【第3题】你在浏览器里同时开了 30 个页面，突然误关整个窗口。最快恢复的姿势是？
A. 打开历史记录一条一条找回来，然后按顺序重新打开每一个
B. 重启浏览器，看它有没有弹「恢复上次会话」的提示条
C. 用 Ctrl+Shift+T 反复按，逐个把关掉的标签按栈顺序拉回来
D. 在设置里打开「启动时恢复上次会话」，再重开一次浏览器

✅ 正确答案：C
💡 解析：Ctrl+Shift+T 是「关闭栈」不是「历史」，按一次回一个刚关掉的页，包括误关整窗后的全部标签。历史和会话恢复都有丢失风险。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',0,v_owner,'question',E'【第4题】关于「本地文件夹怎么组织才不废」，下面哪个原则最经得起用？
A. 按项目 / 客户 / 时间三层分类，越细越好，找东西才快
B. 分「进行中 / 归档 / 素材」三层，语义按状态而不是按内容
C. 所有文件都扔桌面，用文件名前缀分类，反正搜索能兜底
D. 按软件类型分（Word 一堆、PDF 一堆），方便按类型批量操作

✅ 正确答案：B
💡 解析：按「状态」分（在做 / 已完 / 参考）比按「内容」分更抗腐——内容会变，状态迁移是天然清理动作，桌面派和按软件分派几年后一定失控。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',0,v_owner,'question',E'【第5题】下面哪种「备份策略」，才算真的备份了？
A. 重要文件复制一份放同一硬盘另一个盘符里，出错时改回来
B. 定期把桌面整个拖到 U 盘，U 盘平时锁抽屉里避免丢失
C. 开着云盘自动同步文件夹，误删或勒索时能一键回滚原版
D. 云盘 + 本地移动硬盘各留一份，且能回到任意一天的历史版本

✅ 正确答案：D
💡 解析：3-2-1 备份的核心不是「复制几份」，是「异地 + 多介质 + 历史版本」。同盘复制、单云同步都挡不住勒索/误覆盖；只有能回到「任意一天」才算真备份。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',1,v_owner,'question',E'【第1题】你在 Notion / Obsidian 存了 3 年笔记，越来越像垃圾场，搜什么都翻不到。根因通常是？
A. 笔记软件本身检索能力弱，应该换个搜索更强的软件
B. 分类文件夹不够细，得再拆子分类让每篇都有明确归属
C. 存的时候没写「未来自己会用什么词搜它」，缺检索钩子
D. 标签打得太少，每篇至少 5-8 个标签命中率才会真提升

✅ 正确答案：C
💡 解析：知识库废掉的根因几乎都不是工具或分类，而是当初存的时候没为「未来的自己」留检索钩子。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',1,v_owner,'question',E'【第2题】关于「用 AI 帮你管理个人知识库」，哪种理解最准确？
A. 把所有笔记全喂给 AI，它就能替你记住一切，你不用整理
B. AI 摘要能力强，只要让它自动摘要，笔记本身可以随便写
C. AI 是放大器：条目结构清晰、有钩子它才好用，垃圾进则出
D. AI 会自己总结出结构和分类，比人客观，人只负责往里喂料

✅ 正确答案：C
💡 解析：AI 处理你的知识库 = 在你留下的结构上放大。原始笔记没有摘要、没有关键词，它只能编或者答非所问。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',1,v_owner,'question',E'【第3题】下面四种「存东西的姿势」，哪种最可能在半年后还能被自己重新用起来？
A. 看到好文章就点收藏 / Star / 稍后读，等有空再统一整理
B. 转成 PDF 存进「资料」文件夹，按网站名分子目录归档
C. 写一句「我以后会在什么场景下想起它」再连原链接一起存
D. 整段全文复制进笔记里加上原文链接，保证信息不缺失

✅ 正确答案：C
💡 解析：决定「重被用起来」的不是保真度也不是分类深度，是当初有没有写下「未来的调用场景」——它就是检索钩子本身。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',1,v_owner,'question',E'【第4题】知识库的「暂存区 / 整理区 / 精华区」三层结构，最关键的作用是什么？
A. 分区越多越显整齐，看着有秩序，用起来心情也会更好
B. 让「随手存」和「精心整理」错开时机，避免存的时候卡壳
C. 方便同步到多台设备，不同设备访问不同层，避免冲突
D. 对不同重要度的资料做安全隔离，防止误删掉真正的精华

✅ 正确答案：B
💡 解析：三层结构的真正意义是把「捕捉」和「加工」这两件对脑力要求完全不同的事在时间上分开——存的时候不整理，整理的时候不再乱捡。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',1,v_owner,'question',E'【第5题】你想在自己的知识库上跑「问它 = 拿到答案」，最该先做的准备是什么？
A. 找最贵最新的模型接入，模型越强答得越准，其它可以慢慢补
B. 把条目的标题、摘要、关键词补齐，让 AI 有能对上的抓手
C. 把所有笔记合成一个巨型文档喂进去，信息越全 AI 越聪明
D. 先给每篇打 10 个以上标签，标签越密语义匹配越精确

✅ 正确答案：B
💡 解析：「问答式知识库」吃的不是模型强度也不是数据量，是「每一条能不能被检索到」——标题清、摘要有、关键词齐才是地基。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',2,v_owner,'question',E'【第1题】跟教程做到第 5 步命令报错。最像高手的第一动作是？
A. 从头再走一遍，大多数错是前面漏了细节，重来最省时间
B. 自己先把报错正文读一遍——它到底在说少了什么、期望什么
C. 把整段报错原文直接贴给 AI/搜索，让它替你解释是什么意思
D. 先跳过这步继续往下走，很多时候后面步骤会自动带过去

✅ 正确答案：B
💡 解析：贴给 AI 之前，先自己读一遍报错——它 90% 会直接告诉你少了哪个包、路径不对、权限不够。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',2,v_owner,'question',E'【第2题】同一件事，网上 5 篇教程说法完全不同。判断谁靠谱最有效的方式是？
A. 看发布时间，选最新的那篇，越新越接近当前实践
B. 看点赞和收藏，社区认可度最高的那篇通常错得少
C. 看作者是不是官方或大厂员工，来源越权威越可信
D. 看它有没有讲清「适用版本、前置条件、失败长什么样」

✅ 正确答案：D
💡 解析：新、火、作者牛都是弱信号——同样能高赞地错。真正靠谱的教程会先划边界，并告诉你失败长什么样。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',2,v_owner,'question',E'【第3题】教程截图里的界面和你眼前的界面菜单不一样。最合理的第一判断是？
A. 教程写错了，果断关掉换一篇更新的再跟
B. 自己电脑设置有问题，找找是不是被谁改过界面
C. 先看教程日期与当前软件版本差多远，再决定要不要继续
D. 在教程评论区问一句，等作者或其他读者回复再动手

✅ 正确答案：C
💡 解析：菜单不一致 90% 是版本漂移。先看日期与版本差，再决定是继续硬跟、找同版本教程、还是问 AI 帮你映射新旧菜单。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',2,v_owner,'question',E'【第4题】教程让你复制一段命令到终端执行，你完全看不懂它在做什么。最健康的处理是？
A. 教程既然是热门帖，直接复制粘贴回车，效率优先
B. 把这段命令原文贴给 AI，让它逐段解释，再决定要不要跑
C. 跳过这一步，找另一篇「不需要命令行」的图形界面教程
D. 拆成一小段一小段分别执行，出问题时更容易定位到哪段

✅ 正确答案：B
💡 解析：看不懂就跑，是被恶意教程/勒索脚本骗的最常见路径。让 AI 逐段翻成人话，成本极低、代价极高的一步不该省。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',2,v_owner,'question',E'【第5题】在 2026 年，处理「网上教程一堆但都不完全对得上你环境」的最优姿势是？
A. 多找几篇拼在一起，取交集就是最可靠的操作路径
B. 选一篇看着最专业的死磕到底，中途别切别的教程
C. 把你的系统、版本、目标告诉 AI，让它给你「定制版教程」
D. 先自己动手试，遇到错再一个个查，边试边补齐知识

✅ 正确答案：C
💡 解析：2026 年通用教程的价值已经大幅下降。把「你的具体环境 + 你的目标」交给 AI 生成定制步骤，比拼接几篇通用教程稳得多。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',3,v_owner,'question',E'【第1题】同一段提示词，昨天 AI 答得很好，今天答得敷衍。最合理的解释是？
A. 模型偷偷降智，官方压低了免费用户的输出以省算力
B. 生成本身带随机性，上下文和系统提示的差别会造波动
C. 你今天的问题触发了安全策略，模型切到了保守回答
D. 服务器高峰路由到了小模型上，过高峰再问就恢复了

✅ 正确答案：B
💡 解析：「降智」是最常被人脑补的解释。大模型输出天然带温度采样和上下文敏感性——默认解释应该是随机性，不是阴谋。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',3,v_owner,'question',E'【第2题】要在「写作、代码、长文档、图像理解」四类任务里选模型，最健康的策略是？
A. 认准一个综合最强的旗舰模型，四类任务全用它省心
B. 每类都用当下榜单第一名的模型，榜单反映实际上限
C. 固定 2-3 个手感熟的模型按任务分工，再拿小样本换
D. 全交给一个自动路由聚合平台，让它替你决定用哪个

✅ 正确答案：C
💡 解析：「一个打天下」和「每次追榜」都会又贵又慢。真正划算的是自己积累几个手感——知道谁写作稳、谁代码强、谁读长文不丢。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',3,v_owner,'question',E'【第3题】你让 AI 写一段文档，它自信地引用了一份并不存在的「Q3 财报数据」。这属于什么？
A. 模型故障，应该反馈给平台让他们修复以避免继续误导
B. 属于典型幻觉，大模型对数字/引文一贯不可完全信任
C. prompt 写得不够严，只要加一句「不许编造」就能杜绝
D. 换成推理更强的模型或联网模型，这类问题就不会再出现

✅ 正确答案：B
💡 解析：幻觉是大模型的结构性特征，不是 bug 也不是能被一句 prompt 根治的东西。凡涉及具体数字、日期、引文——一律要人复核。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',3,v_owner,'question',E'【第4题】下面四种「和 AI 说话的姿势」，哪种通常能拿到最稳定的高质量回答？
A. 尽量把 prompt 写得又长又严厉，把所有可能都堵死
B. 只写核心一句话，让 AI 自由发挥更能出创意好答案
C. 给它角色、任务、背景、期望输出形式这四件事讲清楚
D. 先问它「你能不能做到」，能它再说就按它给的方式提

✅ 正确答案：C
💡 解析：高质量提示的地基是「角色 + 任务 + 背景 + 期望输出」，不是长短或严厉度。四件事讲清楚，随机性能被压到最低。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',3,v_owner,'question',E'【第5题】给 AI 发工作材料时，下面哪种做法最能同时兼顾效果和安全？
A. 直接把原文贴上去，AI 上下文越完整回答越准
B. 把姓名、公司、金额脱敏成占位符，保留结构再发过去
C. 只发标题和几句摘要，正文不发以彻底避免泄露风险
D. 先问 AI「你会不会保存我的内容」，得到否定后再发

✅ 正确答案：B
💡 解析：脱敏留结构是效果和安全的最优交点——AI 需要的是结构而不是真实身份和数字；只发摘要会掉答案质量，问 AI「保不保存」得到的是话术。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',4,v_owner,'question',E'【第1题】AI IDE 里连续三轮改都没修好同一个 bug，还引出新问题。此时最优做法是？
A. 换个更强的模型继续让它改，能力上来了大概率能修
B. 把 prompt 写得更长、更严厉，逼它这次一定要认真处理
C. 回滚到出错前的干净版本，用一句话把 bug 重新描述再试
D. 接受现状先绕过去做别的，反正这个 bug 不影响主流程

✅ 正确答案：C
💡 解析：AI IDE 陷入死循环的根因几乎都是上下文被前几轮的错误尝试污染了。干净回滚 + 简洁重述，是唯一能跳出循环的动作。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',4,v_owner,'question',E'【第2题】你刚装好 AI IDE，准备做第一个小项目。最合适的第一步是？
A. 先让它一次性把整个项目做完，看看它的完整能力有多强
B. 先做一个能跑起来的最小版本，跑通再一小步一小步加
C. 先花一天时间把所有功能想清楚再动手，避免中途返工
D. 先把 UI 做到漂亮再补功能，好看的第一印象最能给自己动力

✅ 正确答案：B
💡 解析：AI IDE 的最大陷阱是「一次做全」。跑通最小闭环再一小步加，才能让 AI 每一步都在可验证的地基上继续。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',4,v_owner,'question',E'【第3题】AI 改完一段代码，界面看着「好像还行」。此时最不该省的动作是？
A. 立刻提下一个需求，趁着上下文还热让它一鼓作气做完
B. 手动点几下核心路径 + Ctrl+S 存档，确认没坏再继续
C. 让 AI 自己给自己写测试，把验收工作也交给它处理
D. 先把这段代码收藏到笔记里，作为「可复用模板」备用

✅ 正确答案：B
💡 解析：人工过一遍核心路径 + 存档，是 AI 协作里最便宜也最容易被跳过的动作。「好像还行」不做验证 = 把地雷埋进下一轮。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',4,v_owner,'question',E'【第4题】关于 AI IDE 里的「上下文管理」，下面哪种做法最健康？
A. 对话越长越好，让它记住所有细节，回答才能连贯
B. 阶段完成就开新对话，把当下真正需要的资料重新交代
C. 全程只用一个超长对话，出问题时全靠它自己回忆过往
D. 每次都清空重来，避免历史信息干扰当下这一次的回答

✅ 正确答案：B
💡 解析：上下文是有代价的：太长会污染、太短会失忆。「阶段完成开新对话，把关键信息重新交代」是最耐用的节奏。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',4,v_owner,'question',E'【第5题】AI IDE 里，什么样的需求描述最容易换来一次性满意的结果？
A. 写清「做什么、给谁用、成功长什么样、失败长什么样」
B. 只说「按最佳实践帮我优化」，让 AI 用它的判断替你决定
C. 把参考网站链接贴上去，让它照抄那种风格和功能
D. 把「一定要做」和「顺便也做」全列出来，一次做到位

✅ 正确答案：A
💡 解析：「验收标准」是 AI 生成质量的天花板。四件事讲清（做什么/给谁/成功/失败），比任何风格参考或长清单都稳。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',5,v_owner,'question',E'【第1题】关于 Vibe Coding，下面哪句话最接近它的真实内核？
A. 不用懂代码，凭感觉描述几句 AI 就能做出任何产品
B. 重点是审美和交互直觉，功能实现完全甩给 AI 不管
C. 让 AI 写代码，你负责定义要什么、怎样算做完、坏了怎么发现
D. 适合快速出原型和 demo，做上线级产品还得自己动手写

✅ 正确答案：C
💡 解析：Vibe Coding 不是「省掉思考」，是「把思考的位置从写代码换成写需求和验收」。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',5,v_owner,'question',E'【第2题】用 Vibe Coding 做东西，最应该先做到「能用」再谈「好看」。原因是？
A. 好看太耗时间，先能用能省下大量精力后期慢慢再美化
B. 「能用」能立刻验证需求真假，「好看」验证不了任何东西
C. AI 做界面美化能力弱，功能能力强，先扬长避短最合理
D. 用户第一次看的都是功能，界面丑一点大多数人也不介意

✅ 正确答案：B
💡 解析：MVP 先能用不是为了省事，是因为它是唯一能回答「需求真不真」的东西。好看在需求被证伪的产品上一钱不值。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',5,v_owner,'question',E'【第3题】AI 帮你写完一段功能，你自己完全看不懂它写的是什么。健康的做法是？
A. 只要能跑起来就行，看不懂也不用管，能用就是最好的答案
B. 让 AI 用大白话把这段代码解释一遍，再决定留下还是重写
C. 自己去补底层知识，把每一行都学会了再继续下一步
D. 整段删掉自己重写，看不懂的代码留着迟早会出更大的坑

✅ 正确答案：B
💡 解析：「能不能给你解释清楚」是 AI 代码是否可维护的关键测试。看不懂就删太贵，硬学太慢；让它翻成人话，是唯一可持续的姿势。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',5,v_owner,'question',E'【第4题】Vibe Coding 项目做到中期，AI 每次改一个小地方都会莫名其妙弄坏别的。最像根因的是？
A. AI 模型不够聪明，换个更强的模型就能一劳永逸解决
B. 项目缺乏结构和边界，AI 每次都在整块代码里乱翻
C. prompt 里没写「别改动其它文件」，加一句就能立刻好转
D. 运气不好碰到了这几天模型的波动，换个时间再改就正常了

✅ 正确答案：B
💡 解析：这是典型的「意大利面代码」信号——不是模型问题，是没有模块和边界。让 AI 拆结构、明责任，比换模型或加咒语有效得多。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',5,v_owner,'question',E'【第5题】Vibe Coding 里，「不知道底层实现细节」这件事本身应该被看作什么？
A. 严重短板，必须尽快补齐否则任何问题都无从下手
B. 可接受的默认状态，但要能问出好问题、能验证结果
C. 无所谓的事，AI 时代底层细节完全没有学习的价值
D. 临时状态，等 AI 更强了就再也不需要人懂任何细节

✅ 正确答案：B
💡 解析：Vibe Coding 的默认前提就是「你不必懂全部细节」，但代价是你必须能问出好问题、能验证 AI 给的东西——两头都放弃就变成盲操。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',6,v_owner,'question',E'【第1题】用户在访谈里说「我想要一辆更快的马」。产品思维应该怎么处理这句话？
A. 尊重用户意见，就按「更快的马」这个方向优化现有方案
B. 否定用户，用户从来不知道要什么，直接做你判断更好的
C. 把「更快的马」还原成他真正的目标：更省时到达某处
D. 让用户在 A、B、C 三个方案里挑一个，把决定权还回去

✅ 正确答案：C
💡 解析：「更快的马」不是需求，是用户能想到的、最像解决方案的表达。产品思维要还原到「他真正的目标和场景」。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',6,v_owner,'question',E'【第2题】下面四份「MVP 定义」，哪一份最像真正的 MVP？
A. 10 个计划功能各做到 60%，让用户先看到整个产品全貌
B. 只做 1 个功能，做到能验证「用户会不会为它掏钱/掏时间」
C. 先把界面和文案做精致，功能哪怕假的也行，用来打磨印象
D. 先把技术架构和扩展性搭好，具体功能之后再一个个补上

✅ 正确答案：B
💡 解析：MVP 的 M 不是「功能少」，V 也不是「粗糙」。它是「能回答一个具体商业假设的最小实验」。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',6,v_owner,'question',E'【第3题】你收到需求「用户希望首页加个入口」。最像产品经理的第一反应是？
A. 评估工时，排进下一个迭代，按需求原样把入口加上
B. 问「用户加了这个入口，想更快完成的到底是哪件事」
C. 拒绝需求，首页入口一多就乱，明确告诉对方不能这样加
D. 去数据后台看首页点击热区，再决定要不要接受这个需求

✅ 正确答案：B
💡 解析：「加个入口」是解决方案不是需求。先把它翻回目标——想更快完成什么，才能判断加入口是不是最优解。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',6,v_owner,'question',E'【第4题】「5 Why」这个工具，最容易被人用错的方式是？
A. 机械地问满 5 层，每层都追根究底，不停到 5 层不罢休
B. 追问到用户已经不耐烦，仍要求把每一层原因讲清楚
C. 只问 1-2 层就停，然后就宣布「已经拿到根因」赶紧动手
D. 全程只问用户，没有自己观察和数据交叉验证得出的答案

✅ 正确答案：A
💡 解析：5 Why 的「5」是上限不是指标——真正到根因就该停。机械问满 5 层会把问题问偏，也会让被访者反感。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',6,v_owner,'question',E'【第5题】「用户思维」最容易被误解成下面哪种做法？
A. 把用户说的每句话都当需求，认真排期做到里去
B. 把自己当典型用户，凭自己感受推断多数用户会怎么想
C. 去用户身边观察真实场景，看他遇到什么、绕过了什么
D. 定期做用户访谈和可用性测试，用第一手信息校准判断

✅ 正确答案：A
💡 解析：「用户思维」不是「用户说啥做啥」——用户善于描述症状，不善于给方案。照单全收是最常见的伪用户思维。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',7,v_owner,'question',E'【第1题】你按需求做完交付，用户第一反应是「和我想的不一样」。最像产品经理的复盘方向是？
A. 赶紧回去改代码或设计，按用户新反馈迭代下一版再交付
B. 确认「验收标准」当初有没有和用户一起写下来、双方确认
C. 解释你完全按当初需求做的，责任应该在用户表述不清楚
D. 下次接需求前让对方先出份详细文档，避免「说不清」返工

✅ 正确答案：B
💡 解析：「和我想的不一样」几乎从来不是执行问题，而是「什么算做完了」在开工前没有对齐。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',7,v_owner,'question',E'【第2题】你要判断「一个新功能上线之后到底有没有效」。下面哪种做法最靠谱？
A. 问几个用户「你觉得怎么样」，多数说好就算成功了
B. 上线前先定义「什么数字变到多少算成功」，再看它有没到
C. 看后台曲线，只要有涨就说明这个功能真的起了作用
D. 看客服工单，如果没有关于新功能的差评就算平稳落地

✅ 正确答案：B
💡 解析：「有没有效」不是事后感觉能给的答案，是事前定义的门槛能不能被达到。事前不定门槛的功能，几乎全是「怎么解读都行」。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',7,v_owner,'question',E'【第3题】想学一个竞品的产品设计，下面哪种做法最接近专业竞品分析？
A. 把它每个页面截图存下来，UI 上有好看的地方就抄过来用
B. 问「它为什么这样做、放弃了什么、赌的是哪种用户」
C. 把它所有功能都列出来，我们缺哪些就赶紧补哪些进去
D. 找它的用户群做访谈，问他们喜欢/不喜欢什么再照着改

✅ 正确答案：B
💡 解析：竞品分析不是抄功能或抄 UI——每个设计背后都有取舍。抄「结果」等于把别人的赌注复制到自己身上，理解「取舍」才能形成自己的判断。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',7,v_owner,'question',E'【第4题】团队里出现「感觉这个功能很重要，得赶紧做」的推动力时，最像产品经理的反应是？
A. 尊重团队直觉，直觉往往比数据更早看到未来的方向
B. 把「感觉」翻译成「能被证伪的假设」，再想怎么低成本验证
C. 开会投票决定要不要做，多数派认可就排进下个迭代里
D. 先小规模灰度上线看数据反馈，再决定要不要大规模推广

✅ 正确答案：B
💡 解析：「感觉重要」是起点，不是结论。产品经理下功夫的地方是把它翻成一个可验证的假设，再想最便宜的验证方式。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',7,v_owner,'question',E'【第5题】「流程」这件事，产品经理最该做的事情是？
A. 把每一步都写成 SOP 强制执行，越严越标准越不会出错
B. 先把关键节点和责任人画出来，再让执行者自己决定细节
C. 尽量避免建立流程，流程会让创造力和响应速度都变慢
D. 复制业内成熟公司的流程直接用，站在巨人肩上最省事

✅ 正确答案：B
💡 解析：流程的价值是「节点 + 责任」而不是「事无巨细的 SOP」。前者赋能，后者压制；照抄别家的流程会让你水土不服。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',8,v_owner,'question',E'【第1题】队友是「AI 万能派」，凡事都说「让 AI 做就行」，成果经常翻车。最有效的沟通方式是？
A. 在群里公开转他 AI 翻车的截图，用事实让大家都清醒
B. 私下摆事实，拿一次翻车拆给他看是哪步 AI 无法替代
C. 向上汇报让领导来批评他，避免个人冲突且让团队引以为戒
D. 别管他，做好自己的事，AI 派迟早会被现实教会怎么用工具

✅ 正确答案：B
💡 解析：公开打脸伤关系、向上打小报告伤信任、放任不管伤项目。有效沟通几乎总是「私下 + 具体 + 拿事实拆开讲」。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',8,v_owner,'question',E'【第2题】你给队友派活「帮我搞一下这个功能」，队友做出来完全不是你想要的。最应该反思的是？
A. 队友能力不够，下次要挑更靠谱的人来接同类型任务
B. 自己派活时没有讲清目标、背景、验收，只讲了要做什么
C. 队友态度不够认真，需要在过程中多督促和检查完成情况
D. 沟通渠道不合适，下次别用群消息，改用会议同步会更准确

✅ 正确答案：B
💡 解析：派活的锅通常在派活人。目标 / 背景 / 验收三件事没讲清，任何执行者都会做出「不是你想要的」。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',8,v_owner,'question',E'【第3题】你要向不懂技术的老板汇报「这个功能其实做不了」。最像职业选手的姿势是？
A. 直接说「做不了」，越简洁越显专业，别浪费老板时间
B. 详细讲底层原理为什么做不了，让老板从技术角度理解
C. 讲「代价是什么、替代方案是什么、你的建议是什么」
D. 先说能做，回头看情况再解释为什么最终没做出来

✅ 正确答案：C
💡 解析：对不懂技术的人「说做不了」等于「你没努力」。把「代价 + 替代 + 建议」端出来，是让对方能做决策，也是职业选手的默认动作。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',8,v_owner,'question',E'【第4题】和跨部门同事合作，你收到一个只有一句话的需求「帮我做个报表」。最健康的第一反应是？
A. 先接下来动手做，别一开始就问太多问题显得不合作
B. 先反问「给谁看、要回答什么问题、什么时候之前要」
C. 让对方按公司模板出份需求文档，规范流程才有质量保障
D. 按自己经验先做一版，做出来对方一看就知道要不要改

✅ 正确答案：B
💡 解析：一句话需求几乎必坑。花 3 分钟把「读者 / 决策 / 时限」问清楚，比事后返工三轮便宜得多，也比逼对方写文档更实际。');
  INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content) VALUES('ai-tutorial',8,v_owner,'question',E'【第5题】团队协作里，「同步」和「异步」应该怎么用最舒服？
A. 重要的事都开会同步说，白纸黑字容易漏掉关键信息
B. 所有事都用文字异步沟通，效率最高又能留档
C. 决策与对齐用同步，信息传递与推进用异步，各取所长
D. 看紧急程度决定，紧急同步、不紧急异步就能覆盖所有情况

✅ 正确答案：C
💡 解析：「紧急/不紧急」是弱分类。真正好用的是「性质」——需要即时收敛的决策/对齐走同步，其它信息与推进走异步，才不会互相污染。');
END $$;
