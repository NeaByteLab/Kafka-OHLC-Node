const { Kafka } = require('kafkajs')
const dbConnection = require('../db')
require('dotenv').config()

/**
 * Global Variable
 */
let ohlcSymbolMap = {}
const kafkaClient = new Kafka({ clientId: 'ohlcConsumer', brokers: [`${process.env.KAFKA_BROKERS}`] })
const kafkaConsumer = kafkaClient.consumer({ groupId: 'ohlcGroup' })

/**
 * Ensure OHLC Data Table Exists
 */
const ensureOhlcTable = async () => {
  const tableExists = await dbConnection.schema.hasTable('ohlc_data')
  if (tableExists) {
    console.log('✅ Table ohlc_data exists')
  } else {
    await dbConnection.schema.createTable('ohlc_data', tableBuilder => {
      tableBuilder.bigIncrements('id').primary()
      tableBuilder.string('symbol', 20)
      tableBuilder.bigInteger('time')
      tableBuilder.double('open')
      tableBuilder.double('high')
      tableBuilder.double('low')
      tableBuilder.double('close')
    })
    console.log('✅ Table ohlc_data created')
  }
}

/**
 * Aggregate Tick To OHLC
 * Params: TickData
 */
const aggregateTickOhlc = async tickData => {
  const currentTimeSlot = Math.floor(tickData.time / 60000) * 60000
  if (!ohlcSymbolMap[tickData.symbol] || ohlcSymbolMap[tickData.symbol].time !== currentTimeSlot) {
    if (ohlcSymbolMap[tickData.symbol]) {
      console.log(`📥 Save OHLC ${tickData.symbol}:`, ohlcSymbolMap[tickData.symbol])
      await dbConnection('ohlc_data').insert(ohlcSymbolMap[tickData.symbol])
    }
    ohlcSymbolMap[tickData.symbol] = {
      symbol: tickData.symbol,
      time: currentTimeSlot,
      open: tickData.price,
      high: tickData.price,
      low: tickData.price,
      close: tickData.price
    }
  } else {
    const existingOhlc = ohlcSymbolMap[tickData.symbol]
    existingOhlc.high = Math.max(existingOhlc.high, tickData.price)
    existingOhlc.low = Math.min(existingOhlc.low, tickData.price)
    existingOhlc.close = tickData.price
  }
}

/**
 * Run Kafka OHLC Consumer
 */
const runKafkaOhlcConsumer = async () => {
  await ensureOhlcTable()
  await kafkaConsumer.connect()
  await kafkaConsumer.subscribe({ topic: 'market-tick', fromBeginning: true })
  await kafkaConsumer.run({
    eachMessage: async ({ message }) => {
      const parsedTick = JSON.parse(message.value.toString())
      parsedTick.price = parseFloat(parsedTick.price)
      parsedTick.volume = parseFloat(parsedTick.volume)
      if (!(parsedTick.time) || parsedTick.time <= 0) {
        console.warn(`⚠ Skip invalid tick: ${JSON.stringify(parsedTick)}`)
        return
      }
      await aggregateTickOhlc(parsedTick)
    }
  })
}

runKafkaOhlcConsumer().catch(console.error)