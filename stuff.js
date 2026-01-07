var studentNamesWithMemorialLobby = [];
var studentNameButtons = []; 

var guessNameLabels = [];

const maxRoundsToAttemptToQueue = 3;
let nextRoundPromises = [];

var correctStudentThisRound;
let guessedCharacters = [];

var guesses = 1;
var zoomStartPosition;

const maxGuesses = 4;
const startingScale = 30;

//Elements
window.app = {};

async function onLoad(){
    app.loadingScreen = document.getElementById("SiteLoading");
    app.mainScreen = document.getElementById("SiteMain");
    app.mainImage = document.getElementById("mainMemorialLobbyImage");
    app.inputBox = document.getElementById("inputBox");
    app.loadingImage = document.getElementById("loadingImage");
    app.loadingText = document.getElementById("loadingText");   
    app.gameButtons = document.getElementById("buttonsGameOngoing");
    app.endButtons = document.getElementById("buttonsGameOver");
    app.showMoreButton = document.getElementById("showMoreButton");
    app.sideBar = document.getElementById("sideBar");

    app.characterGuessList = document.getElementById("characterGuessList");
    app.guessCounter = document.getElementById("guessCounter");
    app.correctStudentName = document.getElementById("correctStudentName");
    app.correctnessLabel = document.getElementById("correctnessLabel");


    app.loadingImage.src = "LoadingImage_05_en.png";
    app.loadingImage.alt = "Loading image";

    app.loadingScreen.style.display = "block";
    app.mainScreen.style.display = "none";
    
    const f = await fetch("https://bluearchive.wiki/w/api.php?action=parse&page=Memorial_Lobby&prop=links&format=json&origin=*");
    const memorialLobbyWikiJson = (await (f.text()));

    
    //Parse memorial lobby wiki page, put names of students with memorial lobbies into studentNamesWithMemorialLobby array
    let stringToFind = `{"ns":0,"exists":"","*":"`;
    let parsingText = memorialLobbyWikiJson;
    let characterIndex = memorialLobbyWikiJson.indexOf(stringToFind);
    while(characterIndex != -1){
        parsingText = parsingText.substring(characterIndex + stringToFind.length);
        let characterNameLength = parsingText.indexOf(`"`);
        let characterName = parsingText.substring(0, characterNameLength);
        characterName = characterName.replace(`\\uff0a`, `＊`);
        studentNamesWithMemorialLobby.push(characterName);
        parsingText = parsingText.substring(characterNameLength);
        characterIndex = parsingText.indexOf(stringToFind);
    }
    for(let i = 0; i < 8; i ++){    //For non-character buttons that appear at the end of the list
        studentNamesWithMemorialLobby.pop();
    }

    console.log(studentNamesWithMemorialLobby);

    //Create buttons for each character that exists
    let buttonContainer = document.getElementById("inputBoxOptionsContainer");
    studentNamesWithMemorialLobby.forEach(studentName => {
        let button = document.createElement("button");
        button.classList.add("inputBoxOptionsOption");
        button.textContent = studentName;
        buttonContainer.appendChild(button);
        let buttonArray = [button, studentName];
        button.addEventListener("click", (event) => {
            guessCharacter(buttonArray);
        })
        studentNameButtons.push(buttonArray);
    });
    onInputFieldChanged();

    for(let i = 0; i < maxRoundsToAttemptToQueue; i ++){
        nextRoundPromises.push(getPromiseForRound());
    }

    await initializeGame();

}

var prevInput = "";
function onInputFieldChanged(){
    let input = inputBox.value;
    updateInputField();
    prevInput = input;
}
function hideInputField(){
    studentNameButtons.forEach(nameButtonArray => {
        nameButtonArray[0].style.display = "none";
    });
}
function updateInputField(){
    let input = inputBox.value;
    let lowerInput = input.toLowerCase();
    if(input == ""){
        hideInputField();
    }else{
        let inputAddedCharacter = (input.length - prevInput.length) > 0;
        let buttonNamesToExclude = [...guessedCharacters];
        studentNameButtons.forEach(nameButtonArray => {
            let button = nameButtonArray[0];
            if(inputAddedCharacter && button.style.display == "none" && prevInput != ""){return;}
            let studentName = nameButtonArray[1];
            if(buttonNamesToExclude.includes(studentName)){
                buttonNamesToExclude.filter((value) => {return value != studentName;});
                button.style.display = "none";
                return;
            }
            let inputMatchIndex = studentName.toLowerCase().indexOf(lowerInput);
            button.innerHTML = studentName.substring(0, inputMatchIndex) + "<b>" + studentName.substring(inputMatchIndex, inputMatchIndex + input.length) + "</b>" + studentName.substring(inputMatchIndex + input.length);
            if(inputMatchIndex != -1){
                button.style.display = "block";
                if(prevFocusedButton = null){
                    button.focus();
                }
                prevFocusedButton = button;
            }else{
                button.style.display = "none";
            }
        })
    }
}

async function guessCharacter(characterButtonArray){
    app.inputBox.value = "";

    let guessedCorrectly = characterButtonArray && characterButtonArray[1] == correctStudentThisRound;
    if(!guessedCorrectly && guesses < maxGuesses){
        guesses += 1;
        if(guesses >= maxGuesses){
            app.showMoreButton.disabled = true;
        }
        resizeMainImage();
        app.guessCounter.innerHTML = "Guesses: " + guesses + "/" + maxGuesses;

        if(characterButtonArray){
            characterButtonArray[0].style.display = "none";

            let p = document.createElement("option");
            p.classList.add("characterGuessListItem");
            p.classList.add("sideBarText2");
            p.innerHTML = characterButtonArray[1];
            app.characterGuessList.appendChild(p);

            guessedCharacters.push(characterButtonArray[1]);
        }

        return;
    }
    endGame(guessedCorrectly);
}
function endGame(won){
    let finalGuesses = guesses;
    guesses = maxGuesses;
    app.gameButtons.style = "display:none";
    app.endButtons.style = "display:flex";
    app.inputBox.disabled = true;
    app.inputBox.value = ""
    if(won){
        app.correctnessLabel.innerHTML = "You won in " + finalGuesses + " guesses!";
    }else{
        app.correctnessLabel.innerHTML = "You didn't guess the character :("
    }
    correctStudentName.style.display = "block";
    correctnessLabel.style.display ="block"
    onInputFieldChanged();
    resizeMainImage();
}


//Returns a promise, which returns an array: [character Index, character Name, image Link] (representing a round)
//This exists so that rounds can be "loaded" in advance. Fetches for wiki pages can be done asyncronously while the player is playing the game and awaited to avoid race conditions when the round starts.
function getPromiseForRound(){    
    //Pick random character, fix their name string for getting memorial lobby
    let randomCharacterIndex = Math.floor(Math.random() * studentNamesWithMemorialLobby.length);
    let randomCharacterName = studentNamesWithMemorialLobby[randomCharacterIndex];
    let adjustedName = randomCharacterName.replace(/ /g, "_");
    console.log("Getting memorial lobby for " + randomCharacterName + "...");

    let wordsInName = adjustedName.split(/[^a-zA-Z]+/).filter(Boolean);
 
    //console.log("Fetching character wiki page...");


    //Fetch is a promise. Fetch wiki page
    let promise = fetch("https://bluearchive.wiki/w/api.php?action=parse&page=" + adjustedName + "&prop=text&format=json&origin=*")
    .then(wikiPage => wikiPage.text())  //Get wiki page text
    .then(wikiText => {
        //Parse wiki page text, looking for "Memorial_Lobby_CharacterName" in an image link
        const linkStart = "static.wikitide.net/bluearchivewiki/thumb";
        let linkStartIndex = wikiText.indexOf(linkStart);
        let imageLink;
        while(linkStartIndex != -1){
            let link = wikiText.substring(wikiText.indexOf(linkStart));
            let linkEndIndex = linkStart.length + link.substring(linkStart.length).indexOf(".") + 4;
            link = link.substring(0, linkEndIndex);
            wikiText = wikiText.substring(linkStartIndex + linkEndIndex);
            linkStartIndex = wikiText.indexOf(linkStart);
            //Memorial lobby image found, ensure that it is not that of an alter for the same character
            if(link.indexOf("Memorial_Lobby") != -1){
                let wordsInNameThatDontAppearInLink = wordsInName.filter(function(value){return link.indexOf(value) == -1;}).length;
                if(wordsInNameThatDontAppearInLink > 0){continue;}
                let wordsInLink = link.substring(link.indexOf("Memorial")).split(/[^a-zA-Z]+/).filter(function(value){return Boolean(value) && ["Memorial", "Lobby", "png", "jpg"].indexOf(value) == -1});
                let wordsInLinkThatDontAppearInName = wordsInLink.filter(function(value){return !wordsInName.includes(value);}).length;
                if(wordsInLinkThatDontAppearInName > 0){continue;}
                imageLink = link;
                break;
            }
        }
        //Retry this function in case a memorial lobby is not found on the character's wiki page.
        if(imageLink == null){
            console.log(randomCharacterName + " doesn't have a memorial lobby on their wiki!");
            return getPromiseForRound();
        }
        imageLink = "https://" + imageLink.substring(0, imageLink.indexOf("/thumb")) + imageLink.substring(imageLink.indexOf("/thumb") + "/thumb".length);
        console.log("Got memorial lobby for " + randomCharacterName);

        return [randomCharacterIndex, randomCharacterName, imageLink];
    }).then(dataArray => {
        //Load the image in advance
        return new Promise((resolve) => {
            let img = new Image();
            img.src = dataArray[2];
            img.onload = () => {return resolve(dataArray)};
        });
    });

    return promise;
}

//Starts a round.
async function initializeGame(){

    app.loadingScreen.style.display = "block";
    app.mainScreen.style.display = "none";
    app.mainImage.src = "";

    app.gameButtons.style = "display:flex";
    app.endButtons.style = "display:none";
    
    app.showMoreButton.disabled = false;
    app.inputBox.disabled = false;

    let selectedStudentData = await nextRoundPromises[0];
    correctStudentThisRound = selectedStudentData[1];
    guessedCharacters = [];

    app.correctStudentName.innerHTML = "Character: " + correctStudentThisRound;
    app.correctStudentName.style.display = "none";
    app.correctnessLabel.style.display = "none";

    while(app.characterGuessList.hasChildNodes()){
        app.characterGuessList.removeChild(app.characterGuessList.firstChild)
    }

    app.mainImage.src = selectedStudentData[2];
    app.mainImage.alt = "";

    app.mainImage.style = "opacity=0";

    app.loadingScreen.style.display = "none";
    app.mainScreen.style.display = "block";

    guesses = 1;
    app.guessCounter.innerHTML = "Guesses: " + guesses + "/" + maxGuesses;

    zoomStartPosition = [];
    for(let i = 0; i < 2; i ++){
        zoomStartPosition[i] = ((Math.random() - 0.5)/0.5);
        zoomStartPosition[i] = Math.abs(Math.pow(Math.abs(zoomStartPosition[i]), 0.15)) * Math.sign(zoomStartPosition[i]);
        zoomStartPosition[i] *= 0.25;
    }
    resizeMainImage();

    onInputFieldChanged();

    nextRoundPromises.shift();
    nextRoundPromises.push(getPromiseForRound());

    return true;
}

//Zooms in the main image based on wrong guesses.
function resizeMainImage(){
    if(app.mainImage == null){return;}
    let percentageToFailure = Math.min(guesses/maxGuesses, 1);
    let scale = startingScale - ((startingScale - 1) * Math.pow(percentageToFailure, 0.25));
    let zoomPosition = [];
    let imageDimensions = [app.mainImage.clientWidth, app.mainImage.clientHeight];
    for(let i = 0; i < 2; i ++){
        let zoomPos = zoomStartPosition[i] + ((0 - zoomStartPosition[i]) * Math.pow(percentageToFailure, 2));
        zoomPosition[i] = Math.floor(zoomPos * imageDimensions[i]);
    }
    let style = "object-position: " + zoomPosition[0] + "px " + zoomPosition[1] + "px;" + "transform:scale(" + scale + ");";
    app.mainImage.style = style;
}

window.onresize = resizeMainImage;


document.addEventListener("click", (element) =>{
    if(element && element.target.closest("button, input")){return;}
    hideInputField();
})