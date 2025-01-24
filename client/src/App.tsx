
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import Home from "@/pages/home";
import Calendar from "@/pages/calendar";
import MemoryTool from "@/pages/memory-tool";
import BodyGraph from "@/pages/body-graph";

const Stack = createNativeStackNavigator();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Calendar" component={Calendar} />
          <Stack.Screen name="MemoryTool" component={MemoryTool} />
          <Stack.Screen name="BodyGraph" component={BodyGraph} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}

export default App;
