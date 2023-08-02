// eslint-disable-next-line no-unused-vars
const settingsManager = (() => {
	/**
	 * @typedef RequiredSetting
	 * @prop {string} settingName
	 * @prop {any} toBeValue
	 */
	/**
	 * @typedef PresetSetting
	 * @prop {RequiredSetting[]} required
	 * @prop {any} defaultValue
	 * @prop {string} description
	 * @prop {string} propName
	 * @prop {string} type
	 */
	/**
	 * @typedef Setting
	 * @prop {any} value
	 * @prop {string} propName
	 */

	function deepClone(obj) {
		return JSON.parse(JSON.stringify(obj));
	}

	const SettingsManager = class {
		// eslint-disable-next-line no-empty-function
		/**
		 * @param {Object.<string, PresetSetting>} presets
		 */
		constructor(presets) {
			this.presets = presets;
			/**
			 * @type {Object.<string, Setting>}
			 */
			this.settings = {};
			for (let i = 0; i < Object.keys(this.presets).length; i++) {
				const element = Object.keys(this.presets)[i];
				// this.settings[element] = {
				//     // value: this.presets[element].defaultValue,
				//     propName: this.presets[element].propName,
				// };
				// Object.defineProperty(this.settings[element], "value", {  });
				const placeholder = {
					value: this.presets[element].defaultValue,
					propName: this.presets[element].propName,
				};
				this.settings[element] = new Proxy(placeholder, {
					set(obj, prop, value) {
						// const theElement = document.getElementById();
						if (prop === "value") {
							const theElement = document.getElementById("SM-" + obj.propName);
							if (theElement) {
								theElement[theElement.type == "checkbox" ? "checked" : "value"] = value;
							}
						}
						obj[prop] = value;
						return true;
					},
				});
			}
		}
		load(settingsString) {
			/**
			 * @type {Object.<string, Setting>}
			 */
			let settingsParsed = null;
			try {
				settingsParsed = JSON.parse(settingsString);
			}
			catch (error) {
				return error;
			}
			// this.settings = settingsParsed;
			this.originalSettings = deepClone(settingsParsed);
			for (const key in settingsParsed) {
				if (Object.hasOwnProperty.call(settingsParsed, key)) {
					const element = settingsParsed[key];
					this.settings[key] = new Proxy(element, {
						set(obj, prop, value) {
							// const theElement = document.getElementById();
							if (prop === "value") {
								const theElement = document.getElementById("SM-" + obj.propName);
								if (theElement) {
									theElement[theElement.type == "checkbox" ? "checked" : "value"] = value;
								}
							}
							obj[prop] = value;
							return true;
						},
					});
				}
			}
		}
		toString() {
			const copyOfSettings = deepClone(this.settings);
			for (const key in copyOfSettings) {
				if (copyOfSettings[key] && typeof copyOfSettings[key] === "object") {
					delete copyOfSettings[key].settingsThatDependOnMe;
				}
			}

			return JSON.stringify(copyOfSettings);
		}
		toHTML(property) {
			/**
			 * @type {Setting}
			 */
			const setting = this.settings[property] ?? this.presets[property];
			// const setting = this.settings[property];
			if (setting == undefined || this.presets[property] == undefined)
				return null;
			const targetId = "SM-" + this.presets[setting.propName].propName;
			const descriptionAndName = document.createElement('label');
			descriptionAndName.textContent = this.presets[setting.propName].description;
			const label2 = document.createElement('label');
			label2.textContent = ":" + setting.propName;
			label2.style.fontWeight = "bold";
			label2.style.opacity = "35%";
			descriptionAndName.htmlFor = targetId;
			descriptionAndName.appendChild(label2);

			// type handling here
			let value = null;
			switch (this.presets[setting.propName].type) {
				case "checkbox":
					{
						value = document.createElement("input");
						value.type = "checkbox";
						value.checked = setting.value ?? this.presets[setting.propName].defaultValue;
						break;
					}
				case "text":
					{
						value = document.createElement("input");
						value.type = "text";
						value.value = setting.value ?? this.presets[setting.propName].defaultValue;
						break;
					}
				default:
					break;
			}
			value.addEventListener("change", ev => {
				const propName = ev.target.id.split("SM-")[1];
				const targetSetting = this.settings[propName];
				targetSetting.value = ev.target.type == "checkbox" ? ev.target.checked : ev.target.value;
				if (targetSetting.settingsThatDependOnMe) {
					for (let i = 0; i < targetSetting.settingsThatDependOnMe.length; i++) {
						const element = targetSetting.settingsThatDependOnMe[i];
						const targetSetting2 = this.settings[element];

						const requiredSettings = this.presets[targetSetting2.propName].required;
						const theActualElement = document.getElementById("SM-" + element);
						if (requiredSettings) {
							for (let j = 0; j < requiredSettings.length; j++) {
								const element2 = requiredSettings[j];
								const theSetting = this.settings[element2.settingName];
								if (!theSetting)
									continue;
								// if (element2.toBeValue != null) {
								if (theSetting.value != element2.toBeValue) {
									theActualElement.disabled = true;
									targetSetting2.value = this.presets[targetSetting2.propName].defaultValue;
								}
								// }
								else if (element2.toBeValue == theSetting.value) {
									theActualElement.disabled = false;
								}
							}
						}
						if (requiredSettings) {
							theActualElement.title = theActualElement.disabled ? ("This setting depends on " + requiredSettings.map(x => x.settingName).join(", ") + ".") : "";
						}
					}
				}
			});
			// type handling end
			value.id = targetId;
			const requiredSettings = this.presets[setting.propName].required;
			if (requiredSettings) {
				for (let i = 0; i < requiredSettings.length; i++) {
					const element = requiredSettings[i];
					const theSetting = this.settings[element.settingName];
					if (!theSetting)
						continue;
					if (element.toBeValue != null) {
						if (theSetting.value != element.toBeValue) {
							value.disabled = true;
						}
					}
					theSetting.settingsThatDependOnMe = theSetting.settingsThatDependOnMe ?? [];
					theSetting.settingsThatDependOnMe.push(setting.propName);
				}
			}
			if (value.disabled && requiredSettings) {
				value.title = "This setting depends on " + requiredSettings.map(x => x.settingName).join(", ") + ".";
			}
			return [descriptionAndName, value];
		}
		toFullHTML() {
			const keys = Object.keys(this.presets);
			const final = document.createElement("div");
			for (let i = 0; i < keys.length; i++) {
				const settingsItem = document.createElement("div");
				settingsItem.className = "settings-item";
				const output = this.toHTML(keys[i]);
				// settingsItem.appendChild(output[0]);
				// settingsItem.appendChild(output[1]);
				settingsItem.append(...output);
				final.appendChild(settingsItem);
			}
			return final;
		}
	};
	/**
	 * @type {Object.<string, PresetSetting>}
	 */
	const presets = {
		"enableUseOfLocalStorage": {
			propName: "enableUseOfLocalStorage",
			description: "Enable use of LocalStorage for storing settings?",
			defaultValue: false,
			type: "checkbox",
		},
		"enableVideos": {
			propName: "enableVideos",
			description: "Enable videos for lyrics?",
			defaultValue: false,
			type: "checkbox",
			required: [
				{
					settingName: "enableUseOfLocalStorage",
					toBeValue: true,
				},
			],
		},
		"embedUrlForVideos": {
			propName: "embedUrlForVideos",
			description: "The url for video embeds",
			defaultValue: "https://yewtu.be/embed/",
			type: "text",
			required: [
				{
					settingName: "enableUseOfLocalStorage",
					toBeValue: true,
				},
				{
					settingName: "enableVideos",
					toBeValue: true,
				},
			],
		},
	};
	return new SettingsManager(presets);
})();
