# GUIDE

## overall architecture
the frontend and the backend are in the same repository, they communicate via a websockets connection by way of SocketIO
the frontend is a react application and the backend is an express server
the application flow works like this, 
connection established ->
user submits tag for pickup by the backend ->
the backend spews the results back to the frontend which displays said results ->
eventualy the request will be terminated either by the client disconecting manualy or automaticaly by way of browser refresh etc
right now when the server recieves a disconnect message it will end the process, this means that in a live environment it will need to be constantly stood back up again by way of a process manager
