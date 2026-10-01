# newconet

The NewCONet customer site, built and deployed by mitstack managed CI and CD.

## How a change ships

Every change reaches `main` through a pull request. The pull request's build
runs the tests and scanners, builds the image once and pushes it to the
registry under the hash of the commit's tree. When the pull request merges,
the push run looks that image up by the same tree hash and deploys it rather
than building it again.
