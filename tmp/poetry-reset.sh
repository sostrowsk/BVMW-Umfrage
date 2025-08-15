#! /bin/bash

# Remove virtual environment

command="poetry env remove python"
echo $command
eval $command

# Remove poetry.lock
command="poetry install"
echo $command
eval $command

# Whow packages to update
command="poetry show -o"
echo $command
eval $command
