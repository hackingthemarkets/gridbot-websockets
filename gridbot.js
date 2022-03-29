var config = require('./config');
var ccxt = require('ccxt');

(async function () {
    var exchange = new ccxt.ftxus({
        'apiKey': config.API_KEY,
        'secret': config.SECRET_KEY
    });
    var ticker = await exchange.fetchTicker(config.SYMBOL);

    var buyOrders = [];
    var sellOrders = [];

    //var initialBuyOrder = exchange.createMarketBuyOrder(config.SYMBOL, config.POSITION_SIZE * config.NUM_SELL_GRID_LINES);

    for (var i = 1; i <= config.NUM_BUY_GRID_LINES; ++i) {
        var price = ticker['bid'] - (config.GRID_SIZE * i);
        console.log(`submitting market limit buy order at ${price}`);
        var order = await exchange.createLimitBuyOrder(config.SYMBOL, config.POSITION_SIZE, price);
        buyOrders.push(order['info']);
    }

    for (var i = 1; i <= config.NUM_SELL_GRID_LINES; ++i) {
        var price = ticker['bid'] + (config.GRID_SIZE * i);
        console.log(`submitting market limit sell order at ${price}`);
        var order = await exchange.createLimitSellOrder(config.SYMBOL, config.POSITION_SIZE, price);
        sellOrders.push(order['info']);
    }

    while (true) {
        var closedOrderIds = [];
        
        for (var buyOrder of buyOrders) {
            console.log(`checking buy order ${buyOrder['id']}`);
            
            try {
                order = await exchange.fetchOrder(buyOrder['id']);
            } catch (error) {
                console.log("request failed: ", error);
            }
                
            var orderInfo = order['info'];
    
            if (orderInfo['status'] == config.CLOSED_ORDER_STATUS) {
                closedOrderIds.push(orderInfo['id']);
                console.log(`buy order executed at ${orderInfo['price']}`);
                var newSellPrice = parseFloat(orderInfo['price']) + config.GRID_SIZE;
                console.log(`creating new limit sell order at ${newSellPrice}`);
                var newSellOrder = await exchange.createLimitSellOrder(config.SYMBOL, config.POSITION_SIZE, newSellPrice);
                sellOrders.push(newSellOrder);
            }
                
            await new Promise(resolve => setTimeout(resolve, config.CHECK_ORDERS_FREQUENCY));
        }

        for (var sellOrder of sellOrders) {
            console.log(`checking sell order ${sellOrder['id']}`);
            
            try {
                order = await exchange.fetchOrder(sellOrder['id']);
            } catch (error) {
                console.log("request failed: ", error);
            }
                
            var orderInfo = order['info'];
    
            if (orderInfo['status'] == config.CLOSED_ORDER_STATUS) {
                closedOrderIds.push(orderInfo['id']);
                console.log(`sell order executed at ${orderInfo['price']}`);
                var newBuyPrice = parseFloat(orderInfo['price']) - config.GRID_SIZE;
                console.log(`creating new limit buy order at ${newBuyPrice}`);
                var newBuyOrder = await exchange.createLimitBuyOrder(config.SYMBOL, config.POSITION_SIZE, newBuyPrice);
                buyOrders.push(newBuyOrder);
            }
                
            await new Promise(resolve => setTimeout(resolve, config.CHECK_ORDERS_FREQUENCY));
        }

        closedOrderIds.forEach(closedOrderId => {
            buyOrders = buyOrders.filter(buyOrder => buyOrder['id'] != closedOrderId);
            sellOrders = sellOrders.filter(sellOrder => sellOrder['id'] != closedOrderId);
        });

        if (sellOrders.length == 0) {
            console.log("nothing left to sell, exiting");
            process.exit(1);
        }
    }
})();