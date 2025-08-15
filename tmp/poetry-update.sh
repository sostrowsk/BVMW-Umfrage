#! /bin/bash

# Remove poetry.lock
command="rm -f poetry.lock"
echo $command
eval $command

# Update poetry itself
command="pip install --upgrade pip setuptools"
echo $command
eval $command

# Clear poetry cache
command="poetry cache clear pypi --all"
echo $command
eval $command

# Update poetry
command="poetry self update"
echo $command
eval $command

# Remove virtual environment
command="poetry env remove python"
echo $command
eval $command

# Update and reinstall all dependencies
command="poetry update"
echo $command
eval $command

command="poetry show -o"
echo $command
eval $command
