{-
   This file is part of Astarte.

   Copyright 2018 Ispirata Srl

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
-}


module Types.RealmConfig exposing
    ( Config
    , decoder
    , encode
    )

import Json.Decode as Decode exposing (Decoder, Value, field, map, string)
import Json.Encode as Encode


type alias Config =
    { pubKey : String
    }


encode : Config -> Value
encode config =
    Encode.object
        [ ( "jwt_public_key_pem", Encode.string config.pubKey ) ]


decoder : Decoder Config
decoder =
    map Config (field "jwt_public_key_pem" string)
