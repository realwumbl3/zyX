class cached_video {
	constructor(_engine) {
		this._engine = _engine;
		this.VIDEOS = {};
	}

	video_url(file_name) {
		return "/static/bingchilling/dev/packs/" + this._engine.loaded_pack_name + "/clips/" + file_name;
	}

	add_video(file_name) {
		return new Promise((resolve, reject) => {
			if (Object.keys(this.VIDEOS).includes(file_name)) return resolve();
			let xhr = new XMLHttpRequest();
			xhr.onload = (e) => {
				if (e.target.status === 200) {
					let cache_blob = URL.createObjectURL(e.target.response);
					this.VIDEOS[file_name] = cache_blob;
					resolve(cache_blob);
				} else {
					alertFx({ message: "FAILED TO LOAD BINGCHILLING/packs/" + this._engine.loaded_pack_name + "/clips/" + file_name });
					resolve();
				}
			};
			// if (myVid.canPlayType('video/mp4;codecs="avc1.42E01E, mp4a.40.2"')) {}
			xhr.open("GET", this.video_url(file_name));
			xhr.responseType = "blob";
			xhr.send();
		});
	}

	async preload_pack(pack_files) {
		if (this._engine.agent === "Firefox") return false;
		for (let file_name of pack_files) await this.load(file_name);
	}

	async load(file_name) {
		if (this._engine.agent === "Firefox") return this.video_url(file_name);
		await this.add_video(file_name);
		return this.VIDEOS[file_name];
	}
}
