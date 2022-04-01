from websocket_server import WebsocketServer

# Called for every client connecting (after handshake)
def new_client(client, server):
	print("New client connected and was given id %d" % client['id'])
	server.send_message_to_all("Hey all, a new client has joined us")

# Called when a client sends a message
def message_received(client, server, message):
    print("Client(%d) said: %s" % (client['id'], message))
    server.send_message_to_all(message)


PORT = 9001
server = WebsocketServer(port = PORT)
server.set_fn_new_client(new_client)
server.set_fn_message_received(message_received)
server.run_forever()