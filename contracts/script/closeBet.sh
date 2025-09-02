#!/bin/bash
cast send ${BET_CONTRACT} "declareProjectResult(uint8, bool)" $1 $2 --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL}