# 微信读书 API 全量接口参考手册与数据字典

> 本手册汇编自主流开源微信读书增强工具（`wereader`、`obsidian-weread-plugin`）在真实环境下的逆向验证与实测，覆盖 **Web Session 内部接口** 与 **Agent Gateway 官方接口** 两种通信模式。

---

## 1. 认证与凭据机制

### 模式 A：Web Session（主选模式，原生零配置）

在 `weread-plus` 中，Reader Viewport 运行真实的 `https://weread.qq.com`，用户扫码后，浏览器自动存储微信读书主站 Cookie：
- **`wr_vid`**：用户的唯一数值账户 ID（如 `583802764`）。
- **`wr_skey`**：用户登录会话签名密钥（加密字符串，有效期通常为数周）。
- **请求头规范**：
  ```http
  User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36
  Accept: application/json, text/plain, */*
  Accept-Language: zh-CN,zh;q=0.9
  Cookie: wr_vid=583802764; wr_skey=xxxxxx;
  ```

### 模式 B：Agent Gateway（备选模式，长期稳定令牌）

用户在微信读书通过微信扫码生成专属 Agent 授权 Key（格式如 `sk-xxxx...`）：
- **网关地址**：`POST https://i.weread.qq.com/api/agent/gateway`
- **请求头规范**：
  ```http
  Content-Type: application/json
  Authorization: Bearer <AgentGatewayKey>
  ```
- **请求体格式**：
  ```json
  {
    "api_name": "/book/info",
    "skill_version": "1.0.3",
    "bookId": "3300045871"
  }
  ```

---

## 2. 核心 API 字典列表

### 2.1 获取书籍元数据（Book Info）

- **接口地址**：`GET https://weread.qq.com/web/book/info?bookId={bookId}`
- **说明**：获取指定书籍的基础元数据，包括书名、作者、封面图、字数及简介。
- **响应示例**：
  ```json
  {
    "bookId": "3300045871",
    "title": "思考，快与慢",
    "author": "丹尼尔·卡尼曼",
    "cover": "https://wfpub.weread.qq.com/cover/871/3300045871/t6_3300045871.jpg",
    "intro": "丹尼尔·卡尼曼是人类历史上最有影响力的心理学家之一...",
    "totalWords": 428000,
    "category": "心理学",
    "format": "epub",
    "finish": 1
  }
  ```

### 2.2 获取章节目录信息（Chapter Infos）

- **接口地址**：`POST https://weread.qq.com/web/book/chapterInfos`
- **请求体**：
  ```json
  {
    "bookIds": ["3300045871"],
    "synckeys": [0]
  }
  ```
- **响应示例**：
  ```json
  {
    "data": [
      {
        "bookId": "3300045871",
        "chapterUpdateTime": 1698721100,
        "updated": [
          {
            "chapterUid": 1,
            "chapterIdx": 1,
            "title": "序言",
            "level": 1
          },
          {
            "chapterUid": 2,
            "chapterIdx": 2,
            "title": "第一部分 系统1与系统2",
            "level": 1
          },
          {
            "chapterUid": 3,
            "chapterIdx": 3,
            "title": "第1章 一张愤怒的脸与一道乘法题",
            "level": 2
          }
        ]
      }
    ]
  }
  ```

### 2.3 获取用户划线标注（Bookmark List）

- **接口地址**：`GET https://weread.qq.com/web/book/bookmarklist?bookId={bookId}`
- **说明**：获取当前登录用户在本书的所有划线高亮。
- **响应示例**：
  ```json
  {
    "synckey": 12891,
    "updated": [
      {
        "bookmarkId": "3300045871_3_900_2004",
        "chapterUid": 3,
        "bookVersion": 1,
        "range": "900-2004",
        "markText": "系统1的运行是无意识且快速的，不怎么费脑力，没有感觉，完全处于自主控制状态。",
        "style": 1,
        "type": 0,
        "createTime": 1709123400
      }
    ]
  }
  ```
- **关键字段解析**：
  - `style`: `0` 细线划线，`1` 直线高亮，`2` 波浪线。
  - `range`: 划线在章节文本流中的起止字符偏移位置 (`rangeStart-rangeEnd`)。

### 2.4 获取用户想法与书评（Thought / Review List）

- **接口地址**：`GET https://weread.qq.com/web/review/list?bookId={bookId}&listType=11&maxIdx=0&count=0&listMode=2&synckey=0&userVid={userVid}&mine=1`
- **说明**：获取用户针对某段文字写下的个人批注想法或整本书的书评。
- **响应示例**：
  ```json
  {
    "synckey": 451,
    "reviews": [
      {
        "reviewId": "583802764_3300045871_3_900",
        "chapterUid": 3,
        "abstract": "系统1的运行是无意识且快速的...",
        "content": "这里提到了直觉偏见的生理根源，非常关键！",
        "range": "900-2004",
        "createTime": 1709124200,
        "type": 1
      }
    ]
  }
  ```

### 2.5 获取全社区热门划线（Best Bookmarks）

- **接口地址**：`GET https://weread.qq.com/web/book/bestbookmarks?bookId={bookId}`
- **说明**：获取全网读者在本书标记频次最高的金句与段落（前 20~50 条）。
- **响应示例**：
  ```json
  {
    "items": [
      {
        "bookmarkId": "3300045871_3_900_2004",
        "chapterUid": 3,
        "range": "900-2004",
        "markText": "光环效应：喜爱（或讨厌）某个人就会喜爱（或讨厌）这个人的全部——甚至是那些你还没有观察到的方面。",
        "totalCount": 8920
      }
    ]
  }
  ```

### 2.6 获取用户书架数据（Shelf Sync）

- **接口地址**：`GET https://weread.qq.com/web/shelf/sync`
- **说明**：获取用户书架的书籍列表、更新时间及个人阅读进度。
- **响应示例**：
  ```json
  {
    "synckey": 18290,
    "books": [
      {
        "bookId": "3300045871",
        "title": "思考，快与慢",
        "author": "丹尼尔·卡尼曼",
        "cover": "https://wfpub.weread.qq.com/cover/871/3300045871/t6_3300045871.jpg",
        "finishFlag": 0,
        "readingProgress": 42.5,
        "readUpdateTime": 1710321000
      }
    ]
  }
  ```

### 2.7 获取全局阅读统计时长（Read Detail）

- **接口地址**：`GET https://i.weread.qq.com/readdetail?baseTime=0`
- **说明**：获取用户的累计阅读天数、阅读总时长、近期阅读趋势统计。
- **响应示例**：
  ```json
  {
    "totalReadTime": 1284500,
    "totalReadWords": 8500000,
    "continueReadDays": 45,
    "readDetail": [
      {
        "readDate": 20260917,
        "readTime": 5400
      }
    ]
  }
  ```
