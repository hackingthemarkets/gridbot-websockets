import ccxt, config, time, sys

exchange = ccxt.ftxus({
    'apiKey': config.API_KEY,
    'secret': config.SECRET_KEY
})

ticker = exchange.fetch_ticker(config.SYMBOL)

buy_orders = []
sell_orders = []

# initial_buy_order = exchange.create_market_buy_order(config.SYMBOL, config.POSITION_SIZE * config.NUM_SELL_GRID_LINES)

for i in range(config.NUM_BUY_GRID_LINES):
    price = ticker['bid'] - (config.GRID_SIZE * (i+1))
    print("submitting market limit buy order at {}".format(price))
    order = exchange.create_limit_buy_order(config.SYMBOL, config.POSITION_SIZE, price)
    buy_orders.append(order['info'])

for i in range(config.NUM_SELL_GRID_LINES):
    price = ticker['bid'] + (config.GRID_SIZE * (i+1))
    print("submitting market limit sell order at {}".format(price))
    order = exchange.create_limit_sell_order(config.SYMBOL, config.POSITION_SIZE, price)
    sell_orders.append(order['info'])

while True:
    closed_order_ids = []

    for buy_order in buy_orders:
        print("checking buy order {}".format(buy_order['id']))
        try:
            order = exchange.fetch_order(buy_order['id'])
        except Exception as e:
            print("request failed, retrying")
            continue
            
        order_info = order['info']

        if order_info['status'] == config.CLOSED_ORDER_STATUS:
            closed_order_ids.append(order_info['id'])
            print("buy order executed at {}".format(order_info['price']))
            new_sell_price = float(order_info['price']) + config.GRID_SIZE
            print("creating new limit sell order at {}".format(new_sell_price))
            new_sell_order = exchange.create_limit_sell_order(config.SYMBOL, config.POSITION_SIZE, new_sell_price)
            sell_orders.append(new_sell_order)

        time.sleep(config.CHECK_ORDERS_FREQUENCY)

    for sell_order in sell_orders:
        print("checking sell order {}".format(sell_order['id']))
        try:
            order = exchange.fetch_order(sell_order['id'])
        except Exception as e:
            print("request failed, retrying")
            continue
            
        order_info = order['info']

        if order_info['status'] == config.CLOSED_ORDER_STATUS:
            closed_order_ids.append(order_info['id'])
            print("sell order executed at {}".format(order_info['price']))
            new_buy_price = float(order_info['price']) - config.GRID_SIZE
            print("creating new limit buy order at {}".format(new_buy_price))
            new_buy_order = exchange.create_limit_buy_order(config.SYMBOL, config.POSITION_SIZE, new_buy_price)
            buy_orders.append(new_buy_order)

        time.sleep(config.CHECK_ORDERS_FREQUENCY)

    for order_id in closed_order_ids:
        buy_orders = [buy_order for buy_order in buy_orders if buy_order['id'] != order_id]
        sell_orders = [sell_order for sell_order in sell_orders if sell_order['id'] != order_id]

    if len(sell_orders) == 0:
        sys.exit("stopping bot, nothing left to sell")