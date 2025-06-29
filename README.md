# Kafka OHLC Node

🚀 **Real-time OHLC Aggregator with Kafka + Node.js + MySQL (Knex)**  
Multi-symbol support: BTCUSDT, ETHUSDT, BNBUSDT

---

## 📦 Features
- Real-time data from Binance via ccxt
- Kafka Producer stream tick data (multi-symbol)
- Kafka Consumer aggregate OHLC per 1-minute bar
- Auto create MySQL table using Knex
- Save OHLC to MySQL database
- Configurable via `.env` file

---

## 🛠 Requirements
- Docker (for Kafka + Zookeeper)
- Node.js >= 14
- MySQL server
- .env file with database and Kafka configs

---

## ⚙ How to Run

### 1️⃣ Start Kafka + Zookeeper
```
docker compose up -d
```

### 2️⃣ Prepare MySQL
```
CREATE DATABASE IF NOT EXISTS ohlc_kafka;
```

### 3️⃣ Create .env file
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ohlc_kafka
KAFKA_BROKERS=localhost:9092
```

### 4️⃣ Install dependencies
```
npm install
```

### 5️⃣ Run producer (multi-symbol tick stream)
```
node producer/index.js
```

### 6️⃣ Run consumer (OHLC aggregator)
```
node consumer/index.js
```

---

## ⚡ Example Output
**Producer:**
```
📤 Sent tick: {"symbol":"BTCUSDT","price":67000,"volume":123,"time":1719837420000}
📤 Sent tick: {"symbol":"ETHUSDT","price":3500,"volume":456,"time":1719837420000}
```

**Consumer:**
```
📥 Save OHLC BTCUSDT: { symbol: 'BTCUSDT', time: 1719837420000, open: 67000, high: 67020, low: 66990, close: 67010 }
📥 Save OHLC ETHUSDT: { symbol: 'ETHUSDT', time: 1719837420000, open: 3500, high: 3520, low: 3490, close: 3510 }
```

---

## 📂 Project Structure
```
Kafka-OHLC-Node/
├── docker-compose.yml
├── producer/
│   └── index.js
├── consumer/
│   └── index.js
├── db.js
├── package.json
└── README.md
```

---

## 💡 Notes
- Producer fetches ticker every 1s for each symbol.
- Consumer aggregates per 1-minute bucket.
- Table `ohlc_data` auto-created if not exists.
- Use `.env` to manage DB and Kafka connection.

---

## 📄 License
MIT License © 2025 NeaByteLab