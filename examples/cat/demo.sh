#!/bin/bash

SAY() {
  echo
  for entry in "$@"
  do
    echo "$entry"
  done
}

XX() {
  echo
  for cmd in "$@"
  do
    echo "\$ $cmd"
    eval "$cmd"
  done
  sleep 0.1
  read -n 1 -s
}

echo "-----"
echo "$ node cat.js &"
echo "-----"

node cat.js &
pid=$!

sleep 1

SAY "Now let's run a few commands and see what happens!" \
    "Press any key to execute the next command."
read -n 1 -s

SAY "First we look at the output of the task. It is equivalent to" \
    "cat content/english/*.cat > out/english"
XX 'cat out/english'

SAY 'When we add a new file, the output is recalculated.'
XX 'echo FOOOUUUUUUURRR > content/english/4.cat'

XX 'cat out/english'

SAY "When we remove it, the output is also recalculated."
XX 'rm content/english/4.cat'
XX 'cat out/english'

SAY "Now let's create a new directory for german. That writes an empty file."
XX 'mkdir content/german'

SAY "We populate the directory."
XX 'echo EINS > content/german/1.cat' \
   'echo ZWEI ZWEI > content/german/2.cat' \
   'echo DREI DREI DREI > content/german/3.cat'

XX 'cat out/german'

XX 'rm content/german/2.cat'

XX 'cat out/german'

SAY "Now we remove german."
XX 'rm -rf content/german'

kill $pid

SAY "Done. :)"


