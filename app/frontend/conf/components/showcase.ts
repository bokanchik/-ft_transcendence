export function showcase(): HTMLElement {
	
	const container = document.createElement('div');
	container.className = 'bg-white flex flex-col items-center min-h-screen text-black p-8';

	const outerDiv = document.createElement('div');
	outerDiv.className = 'bg-white flex flex-col justify-center items-center min-h-screen text-black p-8';
	outerDiv.innerHTML = `
	<div class="branch-image">
		<svg class="none w-100 h-80 static " width="405" height="352" viewBox="0 0 405 352" fill="none" xmlns="http://www.w3.org/2000/svg">
				<g id="Group 2">
					<path id="branch" d="M368.535 206.71C368.234 207.318 367.71 207.848 366.977 208.302C357.01 209.056 328.707 208.314 282.573 201.239C173.195 180.655 13.0573 135.558 138.297 169.734C197.576 185.91 245.753 195.591 282.573 201.239C324.38 209.106 358.772 213.393 366.977 208.302C371.788 207.938 372.326 207.226 368.535 206.71Z" fill="#197B13" stroke="#0E3C05" stroke-width="2"/>
					<path id="leaf2" d="M342.946 211.23C330.392 253.91 296.969 303.929 281.826 323.603C307.903 260.73 308.333 250.777 342.946 211.23Z" fill="#067042" stroke="#067042"/>
					<path id="leaf1" d="M343.503 208.24C358.893 165.954 341.338 113.805 333.199 93.2834C335.109 133.353 339.476 188.896 343.503 208.24Z" fill="#067042" stroke="#067042"/>
					<path id="leaf4" d="M310.952 207.035C282.949 254.734 249.054 301.565 235.607 319.019C249.386 287.497 283.745 220.97 310.952 207.035Z" fill="#067042" stroke="#067042"/>
					<path id="leaf3" d="M310.867 204.343C324.596 147.618 299.536 98.0579 283.011 71.8242C288.568 107.723 301.919 184.485 310.867 204.343Z" fill="#067042" stroke="#067042"/>
					<path id="leaf5" d="M286.561 202.414C285.73 122.83 262.286 95.1421 246.101 79.6734C255.662 106.033 271.58 160.247 286.561 202.414Z" fill="#067042" stroke="#067042"/>
					<path id="leaf6" d="M288.91 203.269C255.532 255.503 238.611 272.756 187.938 303.797C198.978 289.547 234.628 249.491 288.91 203.269Z" fill="#067042" stroke="#067042"/>
					<path id="leaf8" d="M262.299 198.904C235.052 232.831 190.87 262.119 172.185 272.523C187.284 254.429 226.445 214.374 262.299 198.904Z" fill="#067042" stroke="#067042"/>
					<path id="leaf7" d="M256.234 195.1C262.22 175.144 238.82 143.535 212.652 82.3975C213.473 98.659 223.339 143.966 256.234 195.1Z" fill="#067042" stroke="#067042"/>
					<path id="leaf17" d="M234.32 192.445C183.694 239.147 153.265 256.769 144.379 259.742C150.947 249.008 178.129 220.52 234.32 192.445Z" fill="#067042" stroke="#067042"/>
					<path id="leaf9" d="M219.926 186.674C219.082 152.739 193.452 102.014 180.742 80.893C183.67 101.114 195.605 150.579 219.926 186.674Z" fill="#067042" stroke="#067042"/>
					<path id="leaf10" d="M206 186.926C175.019 220.878 162.118 224.163 125.376 237.395C137.867 227.93 171.479 204.584 206 186.926Z" fill="#067042" stroke="#067042"/>
					<path id="leaf11" d="M195.364 182.523C182.836 136.247 150.833 104.593 136.397 94.5496C143.754 110.884 165.847 151.347 195.364 182.523Z" fill="#067042" stroke="#067042"/>
					<path id="leaf12" d="M177.253 179.656C138.697 206.061 109.094 213.91 99.1117 214.533C108.626 205.935 137.574 186.923 177.253 179.656Z" fill="#067042" stroke="#067042"/>
					<path id="leaf13" d="M157.647 173.584C147.335 143.439 120.015 119.093 107.643 110.689C116.51 125.799 138.924 159.533 157.647 173.584Z" fill="#067042" stroke="#067042"/>
					<path id="leaf14" d="M126.209 166.398C88.3365 190.924 66.9933 195.571 61.0557 194.829C70.2851 187.014 96.2368 170.388 126.209 166.398Z" fill="#067042" stroke="#067042"/>
					<path id="leaf15" d="M107.543 160.668C87.3878 134.177 57.4035 122.022 54.4986 122.207C73.8701 140.325 97.9329 155.397 107.543 160.668Z" fill="#067042" stroke="#067042"/>
					<path id="leaf16" d="M94.8138 157.632C68.5314 165.518 42.0868 153.871 32.1498 147.062C35.6103 145.838 52.9878 146.239 94.8138 157.632Z" fill="#067042" stroke="#067042"/>
				</g>
			</svg>
		</div>`;
		

	const innerDiv = document.createElement('div');
	innerDiv.className = 'text-center bg-grey-300 bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 container mx-auto';

	innerDiv.innerHTML = `
        <h1 class="text-5xl font-bold mb-8 drop-shadow-lg">
          King Pong
        </h1>

        <div class=" gap-6 text-align-center mt-8">
          <a href="/homePage" data-link class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
            Enter the jungle
          </a>
        </div>
    `;
	container.appendChild(innerDiv);
	container.appendChild(outerDiv);
	return container;
}