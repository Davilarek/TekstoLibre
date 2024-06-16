// eslint-disable-next-line spaced-comment
/// <reference path="settings-manager.js"/>
// const useQuestionMark = location.search.length > 0;
/* globals settingsManager */
let useQuestionMark = true;
const isSelfHostedPromise = new Promise(resolve => {
	fetch("./selfHost", { "method": "HEAD" }).then(x => {
		useQuestionMark = x.status != 200;
		resolve();
	}).catch(console.error);
});

// eslint-disable-next-line no-unused-vars
function initializeTekstowoAnyway(proxyType = 2) {
	const TekstowoAPI = require("./TekstowoAPI");
	const TekstowoAPIInstance = new TekstowoAPI(fetch, proxyType);
	return TekstowoAPIInstance;
}

/**
 * @returns {typeof initializeTekstowoAnyway extends () => infer R ? R : any} Note: this is not official JSDOC syntax
 */
function initializeTekstowo(proxyType = 2) {
	try {
		const TekstowoAPI = require("./TekstowoAPI");
		const TekstowoAPIInstance = new TekstowoAPI(fetch, proxyType);
		return TekstowoAPIInstance;
	}
	catch (error) {
		console.error("TekstowoAPI loading failed. Details:", error);
		// return null;
		const dummyObject = {};

		const proxy = new Proxy(dummyObject, {
			get(target, property) {
				if (!(property in target)) {
					target[property] = () => { throw new Error("TekstowoAPI Load Failed!"); };
				}
				return target[property];
			},
		});
		return proxy;
	}
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

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @template T
 * @param {Record<keyof HTMLElement, T>} props
 * @returns {HTMLElementTagNameMap[K]}
 */
function docCreateElement(tag, props = {}, childNodes = [], attrs = {}) {
	const element = document.createElement(tag);

	for (const [key, value] of Object.entries(props)) {
		element[key] = value;
	}

	for (const node of childNodes) {
		if (node instanceof Node) {
			element.appendChild(node);
		}
	}

	for (const [key, value] of Object.entries(attrs)) {
		element.setAttribute(key, value);
	}

	return element;
}
/**
 * @param {Date} date
 */
function makeMinimalisticDateTimeFormat(date) {
	const options = {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
	};

	// helps keep user's preferred date format
	return date.toLocaleDateString(undefined, options);
}
function setupElements() {
	const searchButton = document.getElementById(`searchButton`);
	// const songSearch = document.getElementById(`songSearch`);
	// const artistSearch = document.getElementById(`artistSearch`);
	const querySearch = document.getElementById(`querySearch`);
	if (window.NO_JS) {
		const form = document.createElement('form');
		form.action = "./searchRedirect";
		form.method = "get";
		form.classList.add('search-bar');
		const inputQuery = docCreateElement("input", { id: "querySearch", placeholder: "Search", type: "text", name: "query" });
		const buttonSearch = docCreateElement("button", { id: "searchButton", textContent: "Search", type: "submit" });
		form.appendChild(inputQuery);
		form.appendChild(buttonSearch);
		const searchDiv = document.querySelector('.search-bar');
		searchDiv.parentNode.replaceChild(form, searchDiv);
		return;
	}
	searchButton.addEventListener('click', () => {
		location.href = (useQuestionMark ? '?' : '') + `${TekstowoAPIInstance.ConstantURLPaths.search},` + querySearch.value.replace(/\s/g, "+") + ".html";
	});
	querySearch.onkeydown = (ev) => {
		if (ev.key == "Enter") {
			searchButton.click();
		}
	};
}
/**
 * @param {string} name
 */
async function injectHTML(name) {
	try {
		const targetUrl = new URL(name, "https://localhost");
		if (!targetUrl.pathname.endsWith(".html"))
			throw new Error("Doesn't end with `.html`.");
	}
	catch (error) {
		console.error("Got bad URL on", name, error);
		return;
	}
	const resp = await fetch(name);
	const respText = await resp.text();
	const injectionPoint = document.getElementById('injectionPoint');
	injectionPoint.outerHTML = respText;
}
// eslint-disable-next-line no-unused-vars
const TekstowoAPIInstance = initializeTekstowo();
// const TekstowoAPIInstance = initializeTekstowoAnyway();
/**
 * @param {Object} postInfo
 * @param {string} postInfo.internalId
 * @param {number} postInfo.commentCount
 * @param {'S' | 'A'} postType
 */
function injectComments(postInfo, postType) {
	document.getElementsByClassName("comments-section")[0].before(docCreateElement("p", { textContent: "Loaded comments: ", style: "text-align: center;", id: "loadedCommentsCount" }, [docCreateElement("p", { textContent: "0", style: "display: inline;" }), docCreateElement("p", { textContent: `/${postInfo.commentCount}`, style: "display: inline;" })]));
	if (window.NO_JS)
		return;
	document.getElementsByClassName("comments-section")[0].appendChild(docCreateElement("button", {
		textContent: "Load comments",
		onclick() {
			TekstowoAPIInstance.requestComments(postInfo.internalId, document.getElementById("loadedCommentsCount").children[0].textContent, postType).then(x => {
				console.log("Got API response:", x);
				document.getElementById("loadedCommentsCount").children[0].textContent = parseInt(document.getElementById("loadedCommentsCount").children[0].textContent) + x.length;
				for (let index = 0; index < x.length; index++) {
					const comment = x[index];
					const commentElement = docCreateElement('div', { class: 'comment' }, [
						docCreateElement('div', { className: 'comment-id', style: 'font-size: 0.8em; color: #888;', id: `comment_${comment.commentId}`, textContent: comment.commentId }),
						docCreateElement('div', { className: 'comment-username', style: 'font-weight: bold; color: #4CAF50;', textContent: comment.username }),
						docCreateElement('div', { className: 'comment-date', style: 'font-size: 0.8em; color: #888;', textContent: `${makeMinimalisticDateTimeFormat(comment.date)} (Europe/Warsaw)` }),
						docCreateElement('div', { className: 'comment-score', style: 'font-size: 0.8em; color: #4CAF50;', textContent: `(${comment.score})` }),
						comment.parentCommentId != '' ? docCreateElement("div", { className: 'comment-replyId', style: 'color: #4CAF50;', textContent: `Replying to ` }, [docCreateElement("a", { href: `#comment_${comment.parentCommentId}`, textContent: comment.parentCommentId })]) : false,
						docCreateElement('div', { className: 'comment-text', style: 'margin-top: 10px;', innerHTML: comment.commentText.replace(/\n/g, '<br>') }),
					].filter(Boolean));
					document.getElementsByClassName("comments-section")[0].appendChild(docCreateElement("div", { className: "break", style: "margin-top: 25px;" }));
					document.getElementsByClassName("comments-section")[0].appendChild(commentElement);
				}
			});
		},
	}));
}
function loadLyricsViewer(currentUrlInfo) {
	injectHTML('./presets/song.html').then(() => {
		const operation = currentUrlInfo.split(",")[0];
		TekstowoAPIInstance.extractLyrics(currentUrlInfo.split(operation + ",")[1].split(".html")[0], { withMetadata: true, withVideoId: settingsManager.settings.enableVideos.value }).then((lyrics) => {
			console.log("Got API response:", lyrics);
			if (!lyrics) return;
			const lyricsNormal = document.getElementsByClassName("lyrics-column")[0].getElementsByTagName("p")[0];
			const lyricsTranslated = document.getElementsByClassName("translation-column")[0].getElementsByTagName("p")[0];
			if (lyrics.aiGeneratedTranslation == true) {
				document.getElementsByClassName("translation-column")[0].getElementsByTagName("h2")[0].textContent += " (AI)";
			}
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

				// cell1.innerHTML = "<strong>" + element + ":</strong>";
				const strong = document.createElement("strong");
				strong.textContent = element + ":";
				cell1.appendChild(strong);
				cell2.textContent = val;
				row.appendChild(cell1);
				row.appendChild(cell2);

				newTable.appendChild(row);
			}
			if (lyrics.videoId) {
				const videoFrame = document.getElementById("videoFrame");
				videoFrame.style.display = "unset";
				videoFrame.children[0].src = settingsManager.settings.embedUrlForVideos.value + lyrics.videoId;
			}
			if (lyrics.internalId) {
				injectComments(lyrics);
			}
			document.getElementsByClassName("metadata-section")[0].appendChild(newTable);
			document.title = lyrics.lyricsName + " - lyrics and translation of the song";
			if (window.NO_JS)
				window.bridgeTest.finishedDeferred.resolve();
		});
	});
}
function loadSearchResults(currentUrlInfo) {
	injectHTML('./presets/search.html').then(() => {
		const operation = currentUrlInfo.split(",")[0];
		const settings = createObjectFromCommaSeparatedString(currentUrlInfo.split(operation + ",")[1].split(",").filter((x, y) => y != 0).join(","));
		// if (settings.tytul) settings.tytul = settings.tytul.split(".html")[0];
		settings.tytul = currentUrlInfo.split(operation + ",")[1].split(".html")[0].split(",")[0];
		if (settings.strona) settings.strona = settings.strona.split(".html")[0];
		const pageSelection = document.getElementsByClassName("page-selection")[0];
		const offsetNum = calculatePageOffset((settings.strona ?? 1) - 1);
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
		TekstowoAPIInstance.search(settings.tytul, { page: settings.strona, includePageCount: true }).then(searchResults => {
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
				newElement.getElementsByTagName("h3")[0].textContent = offsetNum(i + 1).toString() + ".";
				const urlCreated = (useQuestionMark ? '?' : '') + `${TekstowoAPIInstance.ConstantURLPaths.song},` + Object.values(searchResults.songs)[i] + ".html";
				// newElement.getElementsByTagName("p")[0].innerHTML = `<a style="color: unset; text-decoration: unset;" href="${urlCreated}">${element}</a>`; // that's lazy
				const aElementForP = document.createElement('a');
				aElementForP.style.cssText = `color: unset; text-decoration: unset;`;
				aElementForP.href = urlCreated;
				aElementForP.textContent = element;
				newElement.getElementsByTagName("p")[0].appendChild(aElementForP);
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
				const urlCreated = (useQuestionMark ? '?' : '') + `${TekstowoAPIInstance.ConstantURLPaths.artistSongs},` + Object.values(searchResults.artists)[i] + ".html";
				// newElement.getElementsByTagName("p")[0].innerHTML = `<a style="color: unset; text-decoration: unset;" href="${urlCreated}">${element}</a>`; // that's lazy
				const aElementForP = document.createElement('a');
				aElementForP.style.cssText = `color: unset; text-decoration: unset;`;
				aElementForP.href = urlCreated;
				aElementForP.textContent = element;
				newElement.getElementsByTagName("p")[0].appendChild(aElementForP);
				// baseElement.appendChild(newElement);
				baseElement.getElementsByClassName("putResultsHere")[1].before(newElement);
			}
			if (searchResults.pageCount) {
				const result = searchResults.pageCount;
				for (let i = 0; i < result; i++) {
					const newButton = document.createElement('button');
					if (!window.NO_JS) {
						newButton.textContent = i + 1;
						newButton.onclick = () => {
							location.href = (useQuestionMark ? '?' : '') + `${TekstowoAPIInstance.ConstantURLPaths.search},` + settings.tytul + ",strona," + (i + 1) + ".html";
						};
					}
					else {
						newButton.appendChild(docCreateElement("a", { textContent: i + 1, href: (useQuestionMark ? '?' : '') + `${TekstowoAPIInstance.ConstantURLPaths.search},` + settings.tytul + ",strona," + (i + 1) + ".html" }));
					}
					if ((i + 1).toString() == settings.strona || (settings.strona == undefined && (i + 1) == 1))
						newButton.style.color = "red";
					pageSelection.appendChild(newButton);
				}
			}
			document.title = "Search - lyrics and translations";
			if (window.NO_JS)
				window.bridgeTest.finishedDeferred.resolve();
		});
	});
}
/**
 * @param {string} currentUrlInfo
 */
function loadArtistSongList(currentUrlInfo) {
	injectHTML('./presets/search.html').then(() => {
		const pageSelection = document.getElementsByClassName("page-selection")[0];
		const operations = currentUrlInfo.split(",").map(x => x.endsWith(".html") ? x.split(".html")[0] : x);
		operations.shift();
		const options = {
			sortMode: undefined,
			sortDir: undefined,
			page: undefined,
		};
		const pageIndex = operations.indexOf("strona");
		if (pageIndex != -1) {
			options.page = operations[pageIndex + 1];
		}
		for (let index = 0; index < operations.length; index++) {
			const element = operations[index];
			let results = { isMode: undefined, value: undefined };
			results = { value: Object.keys(TekstowoAPIInstance.Sorting.SortMode).find(x => TekstowoAPIInstance.Sorting.SortMode[x] === element) ? element : undefined, isMode: true };
			if (!results.value)
				results = { value: Object.keys(TekstowoAPIInstance.Sorting.SortDirection).find(x => TekstowoAPIInstance.Sorting.SortDirection[x] === element) ? element : undefined, isMode: false };
			if (results.value != undefined) {
				if (results.isMode)
					options.sortMode = results.value;
				else
					options.sortDir = results.value;
			}
		}
		TekstowoAPIInstance.getArtistsSongList(operations[0], options).then(response => {
			console.log("Got API response:", response);
			const offsetNum = calculatePageOffset((options.page ?? 1) - 1);
			const template = document.getElementsByClassName("result-item")[0].innerHTML;
			const baseElement = document.getElementsByClassName("results-container")[0];
			document.getElementById("artistsHeader").remove();
			baseElement.getElementsByClassName("putResultsHere")[1].remove();
			const sortOptionsDiv = document.createElement("div");
			// sortOptionsDiv.style.margin = "0 auto";
			// sortOptionsDiv.style.maxWidth = "600px";
			// sortOptionsDiv.style.padding = "20px";
			sortOptionsDiv.style.display = "flex";
			sortOptionsDiv.style.justifyContent = "center";
			sortOptionsDiv.style.alignItems = "center";
			const sortOptionsDir = document.createElement("select");
			const sortOptionsDirSelects = {
				ascending() {
					const final = document.createElement("option");
					final.value = this.ascending.name;
					final.textContent = final.value;
					final.selected = TekstowoAPIInstance.Sorting.SortDirection[final.value] == options.sortDir;
					return final;
				},
				descending() {
					const final = document.createElement("option");
					final.value = this.descending.name;
					final.textContent = final.value;
					final.selected = TekstowoAPIInstance.Sorting.SortDirection[final.value] == options.sortDir;
					return final;
				},
			};
			sortOptionsDir.append(sortOptionsDirSelects.ascending(), sortOptionsDirSelects.descending());
			const sortOptionsMode = document.createElement("select");
			const sortOptionsModeSelects = {
				alphabetically() {
					const final = document.createElement("option");
					final.value = this.alphabetically.name;
					final.textContent = final.value;
					final.selected = TekstowoAPIInstance.Sorting.SortMode[final.value] == options.sortMode;
					return final;
				},
				popular() {
					const final = document.createElement("option");
					final.value = this.popular.name;
					final.textContent = final.value;
					final.selected = TekstowoAPIInstance.Sorting.SortMode[final.value] == options.sortMode;
					return final;
				},
				best() {
					const final = document.createElement("option");
					final.value = this.best.name;
					final.textContent = final.value;
					final.selected = TekstowoAPIInstance.Sorting.SortMode[final.value] == options.sortMode;
					return final;
				},
				date() {
					const final = document.createElement("option");
					final.value = this.date.name;
					final.textContent = final.value;
					final.selected = TekstowoAPIInstance.Sorting.SortMode[final.value] == options.sortMode;
					return final;
				},
			};
			sortOptionsMode.append(sortOptionsModeSelects.alphabetically(), sortOptionsModeSelects.popular(), sortOptionsModeSelects.best(), sortOptionsModeSelects.date());
			sortOptionsDiv.appendChild(sortOptionsDir);
			sortOptionsDiv.appendChild(sortOptionsMode);
			const sortConfirmButton = document.createElement("button");
			sortConfirmButton.textContent = "Confirm sorting";
			sortConfirmButton.onclick = () => {
				const additionalStuff = [
					TekstowoAPIInstance.Sorting.SortMode[Array.from(sortOptionsMode.children).find(x2 => x2.selected).value],
					TekstowoAPIInstance.Sorting.SortDirection[Array.from(sortOptionsDir.children).find(x2 => x2.selected).value],
				];
				location.href = (useQuestionMark ? '?' : '') + `${TekstowoAPIInstance.ConstantURLPaths.artistSongs},` + operations[0] + "," + additionalStuff.join(",") + ",strona,1.html";
			};
			sortOptionsDiv.appendChild(sortConfirmButton);
			baseElement.before(sortOptionsDiv);
			const guessedName = response.results[0].key.match(/(.*)(?= - )/)[0];
			document.getElementById("songsHeader").textContent = guessedName + " " + document.getElementById("songsHeader").textContent;
			for (let i = 0; i < response.results.length; i++) {
				const element = response.results[i];
				const newElement = document.createElement("div");
				newElement.innerHTML = template;
				newElement.style.cssText = "";
				newElement.classList.add("result-item");
				newElement.getElementsByTagName("h3")[0].textContent = offsetNum(i + 1).toString() + ".";
				const urlCreated = (useQuestionMark ? '?' : '') + `${TekstowoAPIInstance.ConstantURLPaths.song},` + element.value + ".html";
				// newElement.getElementsByTagName("p")[0].innerHTML = `<a style="color: unset; text-decoration: unset;" href="${urlCreated}">${element}</a>`; // that's lazy
				const aElementForP = document.createElement('a');
				aElementForP.style.cssText = `color: unset; text-decoration: unset;`;
				aElementForP.href = urlCreated;
				aElementForP.textContent = element.key;
				newElement.getElementsByTagName("p")[0].appendChild(aElementForP);
				// baseElement.appendChild(newElement);
				baseElement.getElementsByClassName("putResultsHere")[0].before(newElement);
			}
			if (response.pageCount) {
				const result = response.pageCount;
				for (let i = 0; i < result; i++) {
					const newButton = document.createElement('button');
					newButton.textContent = i + 1;
					newButton.onclick = () => {
						const additionalStuff = [];
						options.sortMode && additionalStuff.push(options.sortMode);
						options.sortDir && additionalStuff.push(options.sortDir);
						location.href = (useQuestionMark ? '?' : '') + `${TekstowoAPIInstance.ConstantURLPaths.artistSongs},` + operations[0] + "," + additionalStuff.join(",") + ",strona," + (i + 1) + ".html";
					};
					if ((i + 1).toString() == options.page || (options.page == undefined && (i + 1) == 1))
						newButton.style.color = "red";
					pageSelection.appendChild(newButton);
				}
			}
			document.title = "Search - lyrics and translations";
			if (window.NO_JS)
				window.bridgeTest.finishedDeferred.resolve();
		});
	});
}
/**
 * @param {string} currentUrlInfo
 */
function loadArtistProfile(currentUrlInfo) {
	injectHTML("./presets/artistProfile.html").then(() => {
		const operations = currentUrlInfo.split(",").map(x => x.endsWith(".html") ? x.split(".html")[0] : x);
		operations.shift();
		const artistId = operations[0];
		TekstowoAPIInstance.getArtistProfile(artistId).then(response => {
			console.log("Got API response:", response);
			const header = document.getElementsByClassName("header")[0].getElementsByTagName("h1")[0];
			header.innerHTML = response.displayName;
			const artistDescriptionField = document.getElementById("artist-description");
			artistDescriptionField.appendChild(docCreateElement("table", { innerHTML: response.artistDescription.replace(/\n/g, '<br>') }));
			if (response.commentCount > 0 && response.internalId != undefined) {
				injectComments(response, "A");
			}
			if (settingsManager.settings.enableArtistMainImageLoading.value == true) {
				const targetImgHolder = document.getElementById("artistMainImage");
				targetImgHolder.style.display = "unset";
				targetImgHolder.append(docCreateElement("img", { src: "//tekstowo.pl" + response.images[0].hd }));
				const targetImgHolder2 = document.getElementById("artistImages");
				targetImgHolder2.style.display = "unset";
				if (response.images.length > 1) {
					if (settingsManager.settings.enableArtistAllImagesLoading.value == true) {
						for (let index = 1; index < response.images.length; index++) {
							const element = response.images[index];
							targetImgHolder2.append(docCreateElement("a", { href: "//tekstowo.pl" + element.hd, target: "_blank" }, [docCreateElement("img", { src: "//tekstowo.pl" + element.small })]));
						}
					}
					else {
						targetImgHolder2.append(docCreateElement("div", { className: "artist-container" }, [docCreateElement("table", { textContent: "If you want to see more images, enable them on Settings page." })]));
					}
				}
			}
			else {
				document.getElementById("artistGallery").style.display = "none";
			}
			const artistDiscographyContainer = document.getElementById("artist-discography");
			artistDiscographyContainer.append(docCreateElement("table", undefined, [docCreateElement("ol", undefined,
				response.discography.map(x =>
					docCreateElement("li", { textContent: x.name }, [docCreateElement("p", { textContent: `(${x.year})`, style: "display: inline; padding-left: 1vw" }, undefined)]),
				),
			)]));
			document.title = response.displayName + " - photos, discography";
			if (window.NO_JS)
				window.bridgeTest.finishedDeferred.resolve();
		});
	});
}
/**
 * @param {number} pageNum
 */
function calculatePageOffset(pageNum) {
	const base = 30;
	// eslint-disable-next-line no-inline-comments
	return /** @param {number} input */ (input) => (base * pageNum) + input;
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
	const openOfficialHyperlink = document.getElementById(`openOfficialHyperlink`);
	openOfficialHyperlink.href = createOfficialUrl();
	const currentUrl = (useQuestionMark ? location.search.slice(1) : location.href.substring(location.href.lastIndexOf('/') + 1));
	const operation = currentUrl.split(",")[0];
	switch (operation) {
		case TekstowoAPIInstance.ConstantURLPaths.song:
			loadLyricsViewer(currentUrl);
			break;
		case TekstowoAPIInstance.ConstantURLPaths.search:
			loadSearchResults(currentUrl);
			break;
		case TekstowoAPIInstance.ConstantURLPaths.artistSongs:
			loadArtistSongList(currentUrl);
			break;
		case TekstowoAPIInstance.ConstantURLPaths.artistProfile:
			loadArtistProfile(currentUrl);
			break;
		case "": {
			if (window.NO_JS)
				window.bridgeTest.finishedDeferred.resolve();
			break;
		}
		default: {
			alert("Operation (currently) unsupported.");
			if (window.NO_JS)
				window.bridgeTest.finishedDeferred.resolve();
			break;
		}
	}
}
// eslint-disable-next-line no-unused-vars
function flipBodyColors() {
	const originalBackgroundBody = getComputedStyle(document.body).backgroundColor;
	const originalBody = getComputedStyle(document.body).color;
	document.body.style.backgroundColor = originalBody;
	document.body.style.color = originalBackgroundBody;
}
function createOfficialUrl() {
	return "https://tekstowo.pl/" + (useQuestionMark ? location.search.slice(1) : location.href.substring(location.href.lastIndexOf('/') + 1));
}
// eslint-disable-next-line no-unused-vars
function openOfficial() {
	window.open(createOfficialUrl(), '_blank').focus();
}
// setupElements();
// setTimeout(processOperation, 500);
if (localStorage && localStorage.getItem("settings"))
	settingsManager.load(localStorage.getItem("settings"));
setupElements();
isSelfHostedPromise.then(processOperation);
// processOperation(); // race condition; don't use directly!
