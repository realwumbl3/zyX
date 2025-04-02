
  dryPlaceholders() {
    const placeholdersHTML = this.#markup.innerHTML.match(placeholderRegexHTML);

    // Replace HTML placeholders with their corresponding values
    placeholdersHTML?.forEach((ph) => {
      const id = getPlaceholderID(ph);
      const { value } = this.#data[id];
      const htmlTarget = strPlaceholderHTML(getPlaceholderID(ph));
      const objectPlaceholder = value !== null && (typeof value === "object" || typeof value === "function");
      this.#markup.innerHTML = this.#markup.innerHTML.replace(htmlTarget, objectPlaceholder ? htmlTarget : value);
    });
  }
