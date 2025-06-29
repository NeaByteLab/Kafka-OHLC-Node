const ccxt = require('ccxt')
const { Kafka } = require('kafkajs')
require('dotenv').config()

/**
 * Global Variable
 */
const kafkaClient = new Kafka({ clientId: 'ohlcProducer', brokers: [`${process.env.KAFKA_BROKERS}`] })
const kafkaProducer = kafkaClient.producer()
const binanceClient = new ccxt.binance()
const tradingSymbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT']

/**
 * Run OHLC Kafka Producer
 */
const runOhlcProducer = async () => {
  await kafkaProducer.connect()
  while (true) {
    for (const currentSymbol of tradingSymbols) {
      try {
        const tickerData = await binanceClient.fetchTicker(currentSymbol)
        if (!(tickerData.timestamp) || tickerData.timestamp <= 0) {
          console.warn(`⚠ Skipping tick: invalid timestamp for ${currentSymbol}`)
          continue
        }
        if (!(tickerData.last) || tickerData.last <= 0) {
          console.warn(`⚠ Skipping tick: invalid price for ${currentSymbol}`)
          continue
        }
        const tickPayload = {
          symbol: currentSymbol.replace('/', ''),
          price: tickerData.last,
          volume: tickerData.baseVolume,
          time: tickerData.timestamp
        }
        if (currentSymbol === 'BTC/USDT') {
          await kafkaProducer.send({
            topic: 'market-tick',
            messages: [{ value: JSON.stringify(tickPayload) }]
          })
          console.log(`📤 Sent tick: ${JSON.stringify(tickPayload)}`)
        } else {
          console.log(`ℹ Skip DB: ${JSON.stringify(tickPayload)}`)
        }
      } catch (producerError) {
        console.error(`❌ Error on ${currentSymbol}:`, producerError.message)
      }
    }
    await new Promise(resolveDelay => setTimeout(resolveDelay, 1000))
  }
}

runOhlcProducer().catch(console.error)