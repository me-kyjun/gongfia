const config = {
  "*.{ts,tsx,js,jsx,mjs}": ["eslint --fix", "prettier --write"],
  "*.{css,json,yml,yaml}": ["prettier --write"],
};

export default config;
