# Delivery

A pull request merges only when its branch is up to date with `main`. The
`main` branch requires the `managed-ci` check with GitHub's strict policy,
so a branch that has fallen behind shows "Update branch" and waits.

The rule exists so that the tree a pull request's build tested is the tree
that lands. An up-to-date branch merges into exactly the tree its head
already has, so the push run finds the image the pull-request build pushed
under that tree's hash and deploys it. Updating a branch runs a new
pull-request build, because the updated branch is a different tree.
