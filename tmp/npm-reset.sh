#!/bin/bash

command="rm -rf node_modules package-lock.json"
echo $command
eval $command

# Update npm itself
command="sudo npm install -g npm@latest"
echo $command
eval $command

# Clear npm cache
command="npm cache clean --force"
echo $command
eval $command

# Remove node_modules directory
command="rm -rf node_modules"
echo $command
eval $command

# Remove package-lock.json
command="rm -f package-lock.json"
echo $command
eval $command

# Update
command="npm update"
echo $command
eval $command

# Reinstall all dependencies
command="npm install"
echo $command
eval $command
