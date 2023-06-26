const useQuestionMark = true;

function initializeTekstowo(proxyType = 2) {
	const TekstowoAPI = require("./TekstowoAPI");
	const TekstowoAPIInstance = new TekstowoAPI(fetch, proxyType);
	return TekstowoAPIInstance;
}

// const currentUrl = location.search.slice(1);
// const operation = currentUrl.split(",")[0];
// switch (operation) {
//     case "piosenka":
//         console.log(TekstowoAPIInstance.extractLyrics(currentUrl.split(operation + ",")[1].split(".html")[0]));
//         break;
//     default:
//         break;
// }

/**
 * From https://github.com/Davilarek/Tekstowo-Unofficial-API/blob/4c94af70a906490cb64b05bc288259adb8c720cb/index.js#L415
 * @param {string} text
 * @param {string} start
 * @param {string} end
 * @returns {string[]}
 */
function getTextBetween(text, start, end) {
	const results = [];
	let startIndex = 0;

	while (startIndex < text.length) {
		const startIdx = text.indexOf(start, startIndex);
		if (startIdx === -1) {
			break;
		}
		const endIdx = text.indexOf(end, startIdx + start.length);
		if (endIdx === -1) {
			break;
		}
		const match = text.substring(startIdx + start.length, endIdx);
		results.push(match);
		startIndex = endIdx + end.length;
	}
	return results;
}

function setupElements() {
	const searchButton = document.getElementById(`searchButton`);
	const songSearch = document.getElementById(`songSearch`);
	const artistSearch = document.getElementById(`artistSearch`);
	searchButton.addEventListener('click', () => {
		location.href = (useQuestionMark ? '?' : '') + "szukaj,wykonawca," + artistSearch.value + ",tytul," + songSearch.value.replace(/\s/g, "+") + ".html";
	});
	songSearch.onkeydown = (ev) => {
		if (ev.key == "Enter") {
			searchButton.click();
		}
	};
	artistSearch.onkeydown = songSearch.onkeydown;
}
async function injectHTML(name) {
	const resp = await fetch(name);
	const respText = await resp.text();
	const injectionPoint = document.getElementById('injectionPoint');
	injectionPoint.outerHTML = respText;
}
// eslint-disable-next-line no-unused-vars
const TekstowoAPIInstance = initializeTekstowo();
function loadLyricsViewer(currentUrlInfo) {
	injectHTML('./presets/song.html').then(() => {
		const operation = currentUrlInfo.split(",")[0];
		TekstowoAPIInstance.extractLyrics(currentUrlInfo.split(operation + ",")[1].split(".html")[0], true).then((lyrics) => {
			console.log("Got API response:", lyrics);
			if (!lyrics) return;
			const lyricsNormal = document.getElementsByClassName("lyrics-column")[0].getElementsByTagName("p")[0];
			const lyricsTranslated = document.getElementsByClassName("translation-column")[0].getElementsByTagName("p")[0];
			const lyricsHeader = document.getElementsByClassName("header")[0].getElementsByTagName("h1")[0];
			lyricsNormal.innerHTML = lyrics.original.replace(/\n/g, '<br>');
			lyricsTranslated.innerHTML = lyrics.translated.replace(/\n/g, '<br>');
			// eslint-disable-next-line no-inline-comments
			lyricsHeader.innerHTML = lyrics.lyricsName; // is this safe?

			const newTable = document.createElement('table');
			const metaData = lyrics.metadata;
			const metaDataKeys = Object.keys(metaData);
			for (let i = 0; i < metaDataKeys.length; i++) {
				const element = metaDataKeys[i];
				let val = metaData[element];
				if (typeof val !== 'string')
					throw new Error("Metadata value should be string, but is a type \"" + typeof val + "\".");
				const splitVal = val.split(", ");
				// const t = getTextBetween(splitVal[0], "<a", "</a>").map(x => x.split(">")[1]);
				// debugger;
				for (let j = 0; j < splitVal.length; j++) {
					const mod = getTextBetween(splitVal[j], "<a", "</a>").map(x => x.split(">")[1]);
					if (mod.length > 0)
						splitVal[j] = mod;
				}
				val = splitVal.join(", ");

				const row = document.createElement('tr');
				const cell1 = document.createElement('td');
				const cell2 = document.createElement('td');

				cell1.innerHTML = "<strong>" + element + ":</strong>";
				cell2.textContent = val;
				row.appendChild(cell1);
				row.appendChild(cell2);

				newTable.appendChild(row);
			}
			document.getElementsByClassName("metadata-section")[0].appendChild(newTable);
			document.title = lyrics.lyricsName + " - lyrics and translation of the song";
		});
	});
}
function loadSearchResults(currentUrlInfo) {
	injectHTML('./presets/search.html').then(() => {
		const operation = currentUrlInfo.split(",")[0];
		const settings = createObjectFromCommaSeparatedString(currentUrlInfo.split(operation + ",")[1]);
		if (settings.tytul) settings.tytul = settings.tytul.split(".html")[0];
		if (settings.strona) settings.strona = settings.strona.split(".html")[0];
		const pageSelection = document.getElementsByClassName("page-selection")[0];
		// debugger;
		// TekstowoAPIInstance.searchLyrics(settings.wykonawca, settings.tytul, settings.strona, true).then((searchResults) => {
		// 	// return;
		// 	console.log("Got API response:", searchResults);
		// 	const keys = Object.keys(searchResults);
		// 	const template = document.getElementsByClassName("result-item")[0].innerHTML;
		// 	const baseElement = document.getElementsByClassName("results-container")[0];
		// 	for (let i = 0; i < keys.length; i++) {
		// 		const element = keys[i];
		// 		const newElement = document.createElement("div");
		// 		newElement.innerHTML = template;
		// 		newElement.style.cssText = "";
		// 		newElement.classList.add("result-item");
		// 		newElement.getElementsByTagName("h3")[0].textContent = (i + 1).toString() + ".";
		// 		const urlCreated = (useQuestionMark ? '?' : '') + "piosenka," + Object.values(searchResults)[i] + ".html";
		// 		newElement.getElementsByTagName("p")[0].innerHTML = `<a style="color: unset; text-decoration: unset;" href="${urlCreated}">${element}</a>`;
		// 		baseElement.appendChild(newElement);
		// 	}

		// 	/* TekstowoAPIInstance.getPagesForSong(settings.wykonawca, settings.tytul).then((result) => {
		// 		for (let i = 0; i < result; i++) {
		// 			const newButton = document.createElement('button');
		// 			newButton.textContent = i + 1;
		// 			newButton.onclick = () => {
		// 				location.href = (useQuestionMark ? '?' : '') + "szukaj,wykonawca," + settings.wykonawca + ",tytul," + settings.tytul + ",strona," + (i + 1) + ".html";
		// 			};
		// 			pageSelection.appendChild(newButton);
		// 		}
		// 	}); */
		// 	if (searchResults.INTERNAL_PAGE_COUNT) {
		// 		const result = searchResults.INTERNAL_PAGE_COUNT;
		// 		for (let i = 0; i < result; i++) {
		// 			const newButton = document.createElement('button');
		// 			newButton.textContent = i + 1;
		// 			newButton.onclick = () => {
		// 				location.href = (useQuestionMark ? '?' : '') + "szukaj,wykonawca," + settings.wykonawca + ",tytul," + settings.tytul + ",strona," + (i + 1) + ".html";
		// 			};
		// 			if ((i + 1).toString() == settings.strona || settings.strona == undefined)
		// 				newButton.style.color = "red";
		// 			pageSelection.appendChild(newButton);
		// 		}
		// 	}
		// 	document.title = "Search - lyrics and translations";
		// });
		TekstowoAPIInstance.search(settings.wykonawca, settings.tytul, { page: settings.strona, includePageCount: true }).then(searchResults => {
			console.log("Got API response:", searchResults);
			const template = document.getElementsByClassName("result-item")[0].innerHTML;
			const baseElement = document.getElementsByClassName("results-container")[0];
			const songsListKeys = Object.keys(searchResults.songs);
			for (let i = 0; i < songsListKeys.length; i++) {
				const element = songsListKeys[i];
				const newElement = document.createElement("div");
				newElement.innerHTML = template;
				newElement.style.cssText = "";
				newElement.classList.add("result-item");
				newElement.getElementsByTagName("h3")[0].textContent = (i + 1).toString() + ".";
				const urlCreated = (useQuestionMark ? '?' : '') + "piosenka," + Object.values(searchResults.songs)[i] + ".html";
				newElement.getElementsByTagName("p")[0].innerHTML = `<a style="color: unset; text-decoration: unset;" href="${urlCreated}">${element}</a>`;
				// baseElement.appendChild(newElement);
				baseElement.getElementsByClassName("putResultsHere")[0].before(newElement);
			}
			const artistsListKeys = Object.keys(searchResults.artists);
			for (let i = 0; i < artistsListKeys.length; i++) {
				const element = artistsListKeys[i];
				const newElement = document.createElement("div");
				newElement.innerHTML = template;
				newElement.style.cssText = "";
				newElement.classList.add("result-item");
				newElement.getElementsByTagName("h3")[0].textContent = (i + 1).toString() + ".";
				const urlCreated = (useQuestionMark ? '?' : '') + "piosenki_artysty," + Object.values(searchResults.artists)[i] + ".html";
				newElement.getElementsByTagName("p")[0].innerHTML = `<a style="color: unset; text-decoration: unset;" href="${urlCreated}">${element}</a>`;
				// baseElement.appendChild(newElement);
				baseElement.getElementsByClassName("putResultsHere")[1].before(newElement);
			}
			if (searchResults.pageCount) {
				const result = searchResults.pageCount;
				for (let i = 0; i < result; i++) {
					const newButton = document.createElement('button');
					newButton.textContent = i + 1;
					newButton.onclick = () => {
						location.href = (useQuestionMark ? '?' : '') + "szukaj,wykonawca," + settings.wykonawca + ",tytul," + settings.tytul + ",strona," + (i + 1) + ".html";
					};
					if ((i + 1).toString() == settings.strona || settings.strona == undefined)
						newButton.style.color = "red";
					pageSelection.appendChild(newButton);
				}
			}
			document.title = "Search - lyrics and translations";
		});
	});
}
function createObjectFromCommaSeparatedString(target) {
	const KVPairs = target.split(',');
	const finalObject = {};
	for (let i = 0; i < KVPairs.length; i += 2) {
		const key = KVPairs[i];
		const value = KVPairs[i + 1];
		finalObject[key] = value;
	}
	return finalObject;
}
function processOperation() {
	const currentUrl = location.search.slice(1);
	const operation = currentUrl.split(",")[0];
	switch (operation) {
		case "piosenka":
			loadLyricsViewer(currentUrl);
			break;
		case "szukaj":
			loadSearchResults(currentUrl);
			break;
		default:
			break;
	}
}
// eslint-disable-next-line no-unused-vars
function flipBodyColors() {
	const originalBackgroundBody = getComputedStyle(document.body).backgroundColor;
	const originalBody = getComputedStyle(document.body).color;
	document.body.style.backgroundColor = originalBody;
	document.body.style.color = originalBackgroundBody;
}
// eslint-disable-next-line no-unused-vars
function openOfficial() {
	const url = "https://tekstowo.pl/" + location.search.slice(1);
	window.open(url, '_blank').focus();
}
setupElements();
processOperation();
