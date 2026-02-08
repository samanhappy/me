---
author : 青扬
pubDatetime : 2026-02-08T21:00:00.000Z
modDatetime : 2026-02-08T21:00:00.000Z
title : 99 元一年，拥有你的专属 OpenClaw（最新版）
featured : false
draft : true
tags :
  - OpenClaw
description : 介绍如何安装 OpenClaw 以及相关注意事项。
---

OpenClaw 太火了，作为一名开发人员，不折腾一下安装一个总觉得落伍了。本文记录了我如何通过腾讯云的轻量服务器，安装最新版 OpenClaw，并集成到钉钉机器人的全过程，仅供参考，欢迎交流。

### 第一步：购买云服务器

由于 OpenClaw 是一款 24 小时在线的智能个人助理，所以需要一台服务器来运行它。这里不推荐使用日常的笔记本或台式机，一方面需要时刻保持开机不太方便，另一方面目前 OpenClaw 在安全方面的控制并不成熟，直接使用本地电脑存在一定的风险，所以更推荐使用一台独立的云服务器。

OpenClaw 爆火以来，国内的云服务商反应挺快的，迅速推出了各种实惠的云服务器套餐和定制镜像，方便用户安装和使用。我选择的腾讯云推出的 2核2G 轻量应用服务器，活动价一年 99 元，可以说非常实惠了。需要注意的是，腾讯云同时提供了境内和境外的服务器，这里更推荐选择境外的，因为境内的服务器在后续使用和升级过程中，会存在诸多不便，而境外服务器可以非常方便地使用 GitHub、Docker 这类服务。 活动链接在 [https://cloud.tencent.com/act/pro/lighthouse-moltbot?from=29437&Is=home](https://cloud.tencent.com/act/pro/lighthouse-moltbot?from=29437&Is=home)，往下滚动就可以看到境外的服务器了。

<图片>

成功购买后，等待几分钟，就能看到服务器处于运行状态，而且腾讯云已经内置安装好了 OpenClaw，只要在腾讯云后台的应用管理配置一下模型和通道就可以直接使用了。

<图片>

### 第二步：配置模型

模型是智能助理的核心，我选择的 OpenRouter 的 GLM 4.5 Air，一方面方便搭配海外服务器，另一方面免费，用来测试 OpenClaw 效果还不错。不过，腾讯云的模型服务商列表中并没有包含 OpenRouter，需要通过自定义模型的方式来实现，使用类似下面的 JSON 配置即可。

```
{
  "baseUrl": "https://openrouter.ai/api/v1",
  "apiKey": "sk-or-v1-xxx",
  "api": "openai-completions",
  "models": [
    { "id": "z-ai/glm-4.5-air:free", "name": "glm-4.5-air" },
  ]
}
```

其他模型和具体配置介绍可以参照 [https://cloud.tencent.com/developer/article/2625144](https://cloud.tencent.com/developer/article/2625144)。

### 第三步：配置通道

OpenClaw 已经全面支持 QQ、企业微信、钉钉、飞书四大主流平台，具体教程可以参照 [https://cloud.tencent.com/developer/article/2624973](https://cloud.tencent.com/developer/article/2625144)。我选择的是钉钉，只要任意创建一家测试企业就可以集成。

### 第四步：更新（可选）

