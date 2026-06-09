---
title: "万事 grill，mattpocock 的这个技能到底有什么魔法"
subtitle: "你的 AI 太听话了——这才是真正的问题。"
date: 2026-06-09
---
你跟 AI 聊技术方案的时候，有没有过这种体验：

你说「我想把用户认证抽成一个独立模块」，AI 说好。
你说「用 JWT 就行，不用搞太复杂」，AI 说对。
你说「先把 refresh token 存内存里」，AI 说可以，然后开始写代码。

全程顺畅。没有阻力。你觉得这次沟通很高效。

三周后，你发现 refresh token 在页面刷新后丢失，用户每隔几分钟就要重新登录。你回头看那天的对话，发现 AI 从头到尾没有问过你一个问题。你给的每一个决定，它都照单全收。

这不是 bug。这是 LLM 的一个已知行为特征，学术界叫 **sycophancy**——模型倾向于附和用户的观点，即使那些观点有问题。Anthropic 和 DeepMind 在 2023 年就已经发过论文证明：模型越大，越会迎合。因为 RLHF 训练中，人类标注者天然更喜欢跟自己一致的答案。

AI 太听话，不是技术缺陷，是训练目标的历史遗留问题。

认识到这一点之后，你就会理解为什么 Matt Pocock——那个做了 Total TypeScript 教了无数人写类型安全代码的人——会用一个只有 **6 行指令** 的 Claude Code 技能，把自己的 AI 变成了一个「盘问者」。

这个技能叫 **grill-me**。下面是它的全部内容：

```markdown
Interview me relentlessly about every aspect of this plan until we reach
a shared understanding. Walk down each branch of the decision tree,
resolving dependencies between decisions one-by-one. For each question,
provide your recommended answer.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore the
codebase instead.
```

6 行。没有模板、没有检查清单、没有状态机。但它是 Matt 所有技能里最受欢迎的一个。

为什么？因为这 6 行里藏着三个精妙的设计决策。

## 一、「一次一个问题」——强制遍历决策树

我们跟 AI 讨论方案时的自然倾向是什么？一口气说清楚。「我要做一个用户系统，支持邮箱登录和 OAuth，token 用 JWT，存在前端内存里，加一个中间件校验，异常的时候返回 401。」

AI 说好，开始写。你觉得自己讲清楚了，AI 觉得你讲清楚了。但实际上，这段话里有 4 个隐含决策，每一个都可能出错，而你没有逐一审视过。

grill-me 的核心指令是：

> Ask the questions one at a time.

一次一个问题。不是一次问完省时间。是**强制遍历**。

这个设计反直觉到几乎粗暴——正常人的效率直觉是「一次问完，效率最高」。但效率最高的前提是：你的问题已经想清楚了。而 grill-me 要解决的是那个「你还没想清楚」的场景。

在被 grill 的过程中，AI 会揪住你的第一个模糊点，问下去，再问下一个，直到决策树上的每一个分支都被踩过。你会发现自己在回答那些「AI 不问你就不会想」的问题——那些你在第一轮描述里无意识跳过的、藏在一口气说完的长句里的、你不自知地假定「这个肯定没问题」的假设。

这是一个**苏格拉底式的协议**。苏格拉底从不问学生「你到底想说什么？一次性全部告诉我」。他一次只问一个问题，每个问题在你回答之后引向更深的下一个。grill-me 把 AI 从执行者反转成了苏格拉底。

## 二、给出推荐答案——降低决策摩擦

grill-me 的另一个设计细节是：

> For each question, provide your recommended answer.

换成一个低质量的技能，这句话会写成「让用户自己思考并给出答案」。Matt 没有这样做。

AI 先亮底牌。每个问题都带着推荐答案——你不需要从零构建方案，只需要做三件事之一：同意、不同意、修正。

这里藏着一个对人的理解：**人类在空白页面前的决策质量远低于在选项面前的决策质量。** 让用户「自己想」不是尊重，是增加摩擦。一个好的盘问者不会说「你觉得呢」，会说「我倾向于 A，你觉得对吗」。

这行指令把 grill-me 从一个审问者变成了一个协作者。你面对的不是一个叫你证明自己的人，而是一个帮你一起想、但坚持把每个分支都想清楚的人。

## 三、「能查代码就不问人」——尊重注意力

> If a question can be answered by exploring the codebase, explore the
> codebase instead.

这行指令极短，但它挡住了一种非常糟糕的体验：AI 问了你一个它明明可以自己找到答案的问题。

比如你让 AI grill 你的重构方案，它问「这个模块目前有几个调用方？」——这个问题 AI 完全可以自己 grep，不应该浪费你的注意力。grill-me 把 AI 设计成：先自己搞清楚的绝不问人，只有涉及到**你的意图、你的权衡、你的偏好**时才开口。

这三件事放在一起，构成了整个技能的价值：**遍历每一个决策分支 + 降低回答阻力 + 只问必须由你来回答的问题。** 6 行。没了。

## 现在就去试

grill-me 不适合你只是想查个 API 的用法——那是 caveman 的场子。它适合你**即将做一个会后悔的决定之前**。

比如你准备重构一个模块，不要直接让 AI 写代码。先打 `/grill-me`，告诉它你要重构什么，让它来追问你。比如你选了一个技术方案，在被「可行」的惯性推着走之前，让 AI grill 你的选择逻辑。比如你写完了一份设计文档，在找人 review 之前，先让 AI 把所有没想清楚的地方盘一遍。

Matt 在 skills 仓库的 README 里引用了《程序员修炼之道》里的一句话：

> "No-one knows exactly what they want."

没人一开始就清楚自己要什么。grill-me 要做的不是帮你写代码，而是在你写代码之前，让你知道自己到底想要什么。

这是 6 行指令能带来的最好的魔法。