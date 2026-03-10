# Map | Postal Wiki

## Quick Start

Pull the repo and use bun to manage this repo

## Database & Data

### Data

- Coordinates
- Name
- Description
- Address
- Creator
- Picture
- Pickup Time
- Responsible Department
- Postmark Text (originally known as "stamp")
- ZIP/Postal Code (orginally known as "Zip code")
- Status
- Applicant
- Format

---

## 批量导入（Bulk Import）

在「新建条目」页面，切换到「批量导入」标签，将 JSON 数组粘贴到文本框后提交即可。

### 接口

```
POST /api/posts/bulk
Content-Type: application/json

{ "items": [ ... ] }
```

单次最多 **500** 条。

---

### 字段说明

#### 信箱（mailbox）必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 名称 |
| `lat` | number | 纬度（GCJ-02，系统自动转 WGS-84） |
| `lon` | number | 经度（GCJ-02，系统自动转 WGS-84） |
| `address` | string | 地址 |
| `description` | string | 描述（无内容可填 `""` 或 `"/"` 等占位符） |
| `zipcode` | number | 邮政编码 |
| `format` | string \| number | 信箱形态，见下表 |

#### 可选字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | string | `"mailbox"`（默认）或 `"kiosk"` |
| `user` | string | 录入者，默认 `"bulk-import"` |
| `status` | string \| number | 状态，见下表，默认 `"normal"` |
| `pickupTime` | string | 开取时间，如 `"周一至周日，每天15:00、17:30"` |
| `station` | string | 责任部门/所属支局 |
| `PostmarkText` | string | 邮戳文字（也可用 `stamp` 字段） |
| `pictures` | string[] \| string | 图片 URL 数组，或以换行分隔的字符串 |

> 当 `type` 为 `"kiosk"` 时：`address`、`zipcode`、`format`、`pickupTime`、`station`、`PostmarkText` 均可忽略，但 `pictures` 为必填。

---

### status 取值

| 字符串值 | 数字值 | 含义 | 地图颜色 |
|----------|--------|------|----------|
| `"normal"` | `0` | 正常 | 绿色 |
| `"seasonal"` | `1` | 时令性 | 黄色 |
| `"internal"` | `2` | 内部用 | 黄色 |
| `"discarded"` | `3` | 已废弃 | 红色 |
| `"unknown"` | `4` | 未知 | 灰色 |

### format 取值（信箱专用）

| 字符串值 | 数字值 | 含义 |
|----------|--------|------|
| `"wallMountedCube"` | `0` | 壁挂方形 |
| `"freestandingCylinder"` | `1` | 落地圆筒 |
| `"freestandingRectangularPrism"` | `2` | 落地长方体 |
| `"noPhoto"` | `3` | 无图片 |

---

### 完整示例

```json
[
  {
    "type": "mailbox",
    "name": "永安邮政支局信箱",
    "lat": 34.260699,
    "lon": 117.167773,
    "address": "江苏省徐州市泉山区永安街道建国西路92号7楼邮电大楼",
    "description": "业务较为熟练",
    "user": "666",
    "zipcode": 221006,
    "pickupTime": "周一至周日，每天15：00、17：30",
    "station": "永安邮政支局",
    "PostmarkText": "江苏徐州 永安",
    "status": "normal",
    "format": "wallMountedCube"
  },
  {
    "type": "mailbox",
    "name": "东站邮政支局信箱",
    "lat": 34.265325,
    "lon": 117.191912,
    "address": "江苏省徐州市鼓楼区黄楼街道淮海东路7号",
    "description": "",
    "user": "666",
    "zipcode": 221005,
    "pickupTime": "周一至周日，每天15：00、17：00",
    "station": "东站邮政支局",
    "PostmarkText": "江苏徐州 东站",
    "status": "normal",
    "format": "wallMountedCube"
  }
]
```

### 返回格式

```json
{
  "total": 2,
  "imported": 2,
  "failed": 0,
  "errors": []
}
```

若部分条目失败，`errors` 中会包含出错条目的索引和原因，其余条目仍正常写入。
