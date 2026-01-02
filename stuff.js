async function onLoad(){
    var loadingScreen = document.getElementById("SiteLoading");
    var mainScreen = document.getElementById("SiteMain");
    var mainImage = document.getElementById("mainMemorialLobbyImage");

    loadingScreen.style.display = "block";
    mainScreen.style.display = "none";
    

    const f = await fetch("https://bluearchive.wiki/w/api.php?action=parse&page=Memorial_Lobby&prop=links&format=json&origin=*");
    const memorialLobbyWikiJson = (await (f.text()));

    var studentNamesWithMemorialLobby = []

    //console.log(memorialLobbyWikiJson);

    //Parse memorial lobby wiki page, put names of students with memorial lobbies into studentNamesWithMemorialLobby array
    var stringToFind = `{"ns":0,"exists":"","*":"`;
    var parsingText = memorialLobbyWikiJson;
    var characterIndex = memorialLobbyWikiJson.indexOf(stringToFind);
    while(characterIndex != -1){
        parsingText = parsingText.substring(characterIndex + stringToFind.length);
        var characterNameLength = parsingText.indexOf(`"`);
        studentNamesWithMemorialLobby.push(parsingText.substring(0, characterNameLength));
        parsingText = parsingText.substring(characterNameLength);
        characterIndex = parsingText.indexOf(stringToFind);
    }
    for(var i = 0; i < 8; i ++){
        studentNamesWithMemorialLobby.pop();
    }

    console.log(studentNamesWithMemorialLobby);

    //Pick random character, fix their name string for getting memorial lobby
    var randomCharacterIndex = Math.floor(Math.random() * studentNamesWithMemorialLobby.length);
    //randomCharacterIndex = 67;
    var randomCharacterName = studentNamesWithMemorialLobby[randomCharacterIndex];
    randomCharacterName = randomCharacterName.replace(/ /g, "_");
    randomCharacterName = randomCharacterName.replace(`\\uff0a`, `＊`)
    console.log(randomCharacterName);

    //Get & parse character wiki page
    console.log("Fetching character wiki page...");
    var characterWikiPage = await fetch("https://bluearchive.wiki/w/api.php?action=parse&page=" + randomCharacterName + "&prop=text&format=json&origin=*");
    console.log("Getting text from wiki page...");
    var characterWikiText = await (characterWikiPage.text());
    console.log("Parsing wiki page text...");
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
        //console.log(link);
        if(link.indexOf("Memorial_Lobby") != -1){
            memorialLobbyImageLink = link;
            break;
        }
    }
    if(memorialLobbyImageLink == null){
        console.log("No memorial lobby image found!")
        document.getElementById("loadingImage").src = "LoadingImage_49_En.png";
        document.getElementById("loadingImage").alt = "Loading failed";
        return;
    }
    memorialLobbyImageLink = "https://" + memorialLobbyImageLink.substring(0, memorialLobbyImageLink.indexOf("/thumb")) + memorialLobbyImageLink.substring(memorialLobbyImageLink.indexOf("/thumb") + "/thumb".length);
    console.log(memorialLobbyImageLink);

    mainImage.src = memorialLobbyImageLink;
    mainImage.alt = randomCharacterName;

    loadingScreen.style.display = "none";
    mainScreen.style.display = "block";
}
