const app = require("./index");

const PORT = 8080;

app.listen(PORT, () => {
    console.log(`app listening on port: ${PORT}`)
})

module.exports = app;