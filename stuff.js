var studentNamesWithMemorialLobby = [];
var studentNameButtons = []; 

var correctStudentThisRound;

//Elements
var loadingScreen;
var mainScreen;
var mainImage;
var inputBox;
var loadingImage;
var loadingText;

async function onLoad(){
    loadingScreen = document.getElementById("SiteLoading");
    mainScreen = document.getElementById("SiteMain");
    mainImage = document.getElementById("mainMemorialLobbyImage");
    inputBox = document.getElementById("inputBox");
    loadingImage = document.getElementById("loadingImage");
    loadingText = document.getElementById("loadingText");

    loadingImage.src = "LoadingImage_05_en.png";
    loadingImage.alt = "Loading image";

    loadingScreen.style.display = "block";
    mainScreen.style.display = "none";
    
    const f = await fetch("https://bluearchive.wiki/w/api.php?action=parse&page=Memorial_Lobby&prop=links&format=json&origin=*");
    const memorialLobbyWikiJson = (await (f.text()));

    
    //Parse memorial lobby wiki page, put names of students with memorial lobbies into studentNamesWithMemorialLobby array
    var stringToFind = `{"ns":0,"exists":"","*":"`;
    var parsingText = memorialLobbyWikiJson;
    var characterIndex = memorialLobbyWikiJson.indexOf(stringToFind);
    while(characterIndex != -1){
        parsingText = parsingText.substring(characterIndex + stringToFind.length);
        var characterNameLength = parsingText.indexOf(`"`);
        var characterName = parsingText.substring(0, characterNameLength);
        characterName = characterName.replace(`\\uff0a`, `＊`);
        studentNamesWithMemorialLobby.push(characterName);
        parsingText = parsingText.substring(characterNameLength);
        characterIndex = parsingText.indexOf(stringToFind);
    }
    for(var i = 0; i < 8; i ++){    //For non-character buttons that appear at the end of the list
        studentNamesWithMemorialLobby.pop();
    }

    console.log(studentNamesWithMemorialLobby);

    //Create buttons for each character that exists
    var buttonContainer = document.getElementById("inputBoxOptionsContainer");
    studentNamesWithMemorialLobby.forEach(studentName => {
        var button = document.createElement("button");
        button.classList.add("inputBoxOptionsOption");
        button.textContent = studentName;
        buttonContainer.appendChild(button);
        var buttonArray = [button, studentName];
        button.addEventListener("click", (event) => {
            guessCharacter(buttonArray);
        })
        studentNameButtons.push(buttonArray);
    });
    onInputFieldChanged();

    await initializeGame();

}

var prevInput = "";
function onInputFieldChanged(){
    var input = inputBox.value;
    var lowerInput = input.toLowerCase();
    if(input == ""){
        studentNameButtons.forEach(nameButtonArray => {
            nameButtonArray[0].style.display = "none";
        });
    }else{
        var inputAddedCharacter = (input.length - prevInput.length) > 0;
        studentNameButtons.forEach(nameButtonArray => {
            var button = nameButtonArray[0];
            if(inputAddedCharacter && button.style.display == "none" && prevInput != ""){return;}
            var studentName = nameButtonArray[1];
            var inputMatchIndex = studentName.toLowerCase().indexOf(lowerInput);
            button.innerHTML = studentName.substring(0, inputMatchIndex) + "<b>" + studentName.substring(inputMatchIndex, inputMatchIndex + input.length) + "</b>" + studentName.substring(inputMatchIndex + input.length);
            if(inputMatchIndex != -1){
                button.style.display = "block";
            }else{
                button.style.display = "none";
            }
        })
    }

    prevInput = input;
}

async function guessCharacter(characterButtonArray){
    var loadingToDisplay;
    if(characterButtonArray[1] == correctStudentThisRound){
        loadingToDisplay = ["GuessCorrect.png", "Correct Guess", ""]
    }else{
        loadingToDisplay = ["GuessWrong.png", "Wrong Guess", "Previous lobby: " + correctStudentThisRound];
    }
    loadingImage.src = loadingToDisplay[0];
    loadingImage.alt = loadingToDisplay[1];
    loadingText.innerHTML = loadingToDisplay[2];
    await initializeGame();
}

async function initializeGame(){

    loadingScreen.style.display = "block";
    mainScreen.style.display = "none";

    //Pick random character, fix their name string for getting memorial lobby
    var randomCharacterIndex = Math.floor(Math.random() * studentNamesWithMemorialLobby.length);
    //randomCharacterIndex = 116;
    var randomCharacterName = studentNamesWithMemorialLobby[randomCharacterIndex];
    correctStudentThisRound = randomCharacterName;
    randomCharacterName = randomCharacterName.replace(/ /g, "_");
    console.log(randomCharacterIndex + " - " + randomCharacterName);

    var wordsInName = randomCharacterName.split(/[^a-zA-Z]+/).filter(Boolean);
 
    //Get & parse character wiki page
    console.log("Fetching character wiki page...");
    var characterWikiPage = await fetch("https://bluearchive.wiki/w/api.php?action=parse&page=" + randomCharacterName + "&prop=text&format=json&origin=*");
    var characterWikiText = await (characterWikiPage.text());
    //console.log(characterWikiText);
    parsingText = characterWikiText;
    const linkStart = "static.wikitide.net/bluearchivewiki/thumb";
    var linkStartIndex = parsingText.indexOf(linkStart);
    var memorialLobbyImageLink;
    //Parse character wiki page, looking for memorial lobby link
    while(linkStartIndex != -1){
        var link = parsingText.substring(parsingText.indexOf(linkStart));
        var linkEndIndex = linkStart.length + link.substring(linkStart.length).indexOf(".") + 4;
        link = link.substring(0, linkEndIndex);
        parsingText = parsingText.substring(linkStartIndex + linkEndIndex);
        linkStartIndex = parsingText.indexOf(linkStart);
        if(link.indexOf("Memorial_Lobby") != -1){
            var wordsInNameThatDontAppearInLink = wordsInName.filter(function(value){return link.indexOf(value) == -1;}).length;
            if(wordsInNameThatDontAppearInLink > 0){continue;}
            var wordsInLink = link.substring(link.indexOf("Memorial")).split(/[^a-zA-Z]+/).filter(function(value){return Boolean(value) && ["Memorial", "Lobby", "png", "jpg"].indexOf(value) == -1});
            var wordsInLinkThatDontAppearInName = wordsInLink.filter(function(value){return !wordsInName.includes(value);}).length;
            if(wordsInLinkThatDontAppearInName > 0){continue;}
            memorialLobbyImageLink = link;
            break;
        }
    }
    if(memorialLobbyImageLink == null){
        console.log("No memorial lobby image found!")
        await initializeGame();
        return false;
    }
    memorialLobbyImageLink = "https://" + memorialLobbyImageLink.substring(0, memorialLobbyImageLink.indexOf("/thumb")) + memorialLobbyImageLink.substring(memorialLobbyImageLink.indexOf("/thumb") + "/thumb".length);
    console.log(memorialLobbyImageLink);

    mainImage.src = memorialLobbyImageLink;
    mainImage.alt = randomCharacterName;

    inputBox.value = "";
    onInputFieldChanged();

    loadingScreen.style.display = "none";
    mainScreen.style.display = "block";
    return true;
}