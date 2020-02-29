function rps(message){
    const rpsenum = {
        ROCK : 1,
        PAPER : 2,
        SCISSORS : 3,
    }
    const filter = m => m.author.id === message.author.id;
    message.channel.send("Choose your weapon to go against Kaede!! :boxing_glove:");
    let draw = true;
    message.channel.awaitMessages(filter, {max: 1, time : 10000, errors: ['time']}).then(collected => {
        let kaedechoice = Math.ceil(Math.random() * 3);
        if (kaedechoice === 1) {
            message.channel.send("rock!");
        }
        else if (kaedechoice === 2) {
            message.channel.send("paper!");
        }
        else if (kaedechoice === 3) {
            message.channel.send("scissors!");
        }
        let win = 3;
        switch (collected.first().content.toLowerCase()) {
            case "rock":
                win = kaedechoice - rpsenum.ROCK;
                break;
            case "scissors":
                win = kaedechoice - rpsenum.SCISSORS;
                break;
            case "paper":
                win = kaedechoice - rpsenum.PAPER;
                break;
            default:
                message.channel.send("Kaede wants to play seriously!! <:4199_charlotte_ugh:683110139024113697>");
                draw = false;
                break;
        }
        if (win === 1 || win === -2) {
            message.channel.send("Kaede always wins <:Hehe:683109333411954767>");
            draw = false;
        }
        else if (win === 2 || win === -1) {
            message.channel.send("You cheated! <:illyapout:683110138235977758>");
            draw = false;
        }
        else if (win === 0) {
            message.channel.send("one more time!");
        }
    }, collected => message.channel.send("Kaede waited too long!")).catch(console.log("rps gone wrong"));
}