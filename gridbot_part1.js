
const url = "wss://stream.data.alpaca.markets/v1beta1/crypto";
const socket = new WebSocket(url);

const auth = {"action": "auth", "key": "yourapikey", "secret": "yourapisecret"}

const subscribe = {"action":"subscribe", "trades":["ETHUSD"], "quotes":["ETHUSD"], "bars":["ETHUSD"]}

const quotesElement = document.getElementById('quotes');
const tradesElement = document.getElementById('trades');

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    const message = data[0]['msg'];

    if (message == 'connected') {
        console.log('do authentication');
        socket.send(JSON.stringify(auth));
    }

    if (message == 'authenticated') {
        socket.send(JSON.stringify(subscribe));
    }

    for (var key in data) {

        const type = data[key].T;

        if (type == 'q') {
            console.log('got a quote');
            console.log(data[key]);

            const quoteElement = document.createElement('div');
            quoteElement.className = 'quote';
            quoteElement.innerHTML = `<b>${data[key].t}</b> ${data[key].bp} ${data[key].ap}`;
            quotesElement.appendChild(quoteElement);

            var elements = document.getElementsByClassName('quote');
            if (elements.length > 10) {
                quotesElement.removeChild(elements[0]);
            }
        }

        if (type == 't') {
            console.log('got a trade');
            console.log(data[key]);
            
            const tradeElement = document.createElement('div');
            tradeElement.className = 'trade';
            tradeElement.innerHTML = `<b>${data[key].t}</b> ${data[key].p} ${data[key].s}`;
            tradesElement.appendChild(tradeElement);

            var elements = document.getElementsByClassName('trade');
            if (elements.length > 10) {
                tradesElement.removeChild(elements[0]);
            }
        }

        if (type == 'b') {
            console.log('got a new bar');
            console.log(data[key]);
        }
    }
}
