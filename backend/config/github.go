package config

type GitHub struct {
	RepoOwner string `env:"SPLITR_REPO_OWNER"   env-default:"dmitrorlov"`
	RepoName  string `env:"SPLITR_REPO_NAME"    env-default:"splitr"`
	Token     string `env:"SPLITR_GITHUB_TOKEN"`
}
