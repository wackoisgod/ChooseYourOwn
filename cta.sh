curl -X POST -H "Content-Type: application/json" -d '{
  "setting_type":"call_to_actions",
  "thread_state":"new_thread",
  "call_to_actions":[
    {
      "payload":"INITIAL_MESSAGE"
    }
  ]
}' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAAEOgm1mU0kBACAv5w7QI79Lsdv5wFvxsKipyheUpATxpsnjV9weEEC2EobNsdj12KN03vHFTg39PrAHf9r0ZChjTquTr89brZCQo5m4XvBxAc6M37nDEUuKZCmRj7ZCMZApWFiPZAuKmOqpg50jEuYCivoRIeTM1H9WVdZCKs5OgZDZD"