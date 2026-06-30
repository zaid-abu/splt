import re

def process_index():
    with open("src/app/(tabs)/index.tsx", "r") as f:
        content = f.read()

    # Remove PageAnimator import
    content = re.sub(r'import\s+{\s*PageAnimator\s*}\s+from\s+["\']@/components/PageAnimator["\'];\n?', '', content)
    if "react-native-reanimated" not in content:
        content = re.sub(
            r'(import .* from "expo-router";\n)',
            r'\1import Animated, { FadeInDown } from "react-native-reanimated";\n',
            content
        )
    # Replace root wrapper
    content = content.replace('<PageAnimator>', '<Animated.View style={{ flex: 1 }} entering={FadeInDown.duration(300).springify()}>')
    content = content.replace('</PageAnimator>', '</Animated.View>')

    # 1. Header
    content = content.replace('<View className="flex-row items-center justify-between px-6 pt-4 mb-8">', '<Animated.View entering={FadeInDown.delay(0).springify()} className="flex-row items-center justify-between px-6 pt-4 mb-8">')
    # find the matching closing tag for header
    content = content.replace('</PressableFeedback>\n          </View>\n\n          {/* ── Enhanced Hero Card', '</PressableFeedback>\n          </Animated.View>\n\n          {/* ── Enhanced Hero Card')

    # 2. Enhanced Hero Card
    content = content.replace('<View className="px-6 mb-8">\n            <View\n              className="rounded-[32px]"\n              style={{\n              }}\n            >', '<Animated.View entering={FadeInDown.delay(100).springify()} className="px-6 mb-8">\n            <View\n              className="rounded-[32px]"\n              style={{\n              }}\n            >')
    content = content.replace('</View>\n              </View>\n            </View>\n          </View>\n\n          {/* ── Functional Quick Actions Grid', '</View>\n              </View>\n            </View>\n          </Animated.View>\n\n          {/* ── Functional Quick Actions Grid')

    # 3. Functional Quick Actions Grid
    content = content.replace('<View className="px-6 mb-10">\n            <View className="flex-row justify-between">', '<Animated.View entering={FadeInDown.delay(200).springify()} className="px-6 mb-10">\n            <View className="flex-row justify-between">')
    content = content.replace('</PressableFeedback>\n              ))}\n            </View>\n          </View>\n\n          {/* ── Outstanding Balances', '</PressableFeedback>\n              ))}\n            </View>\n          </Animated.View>\n\n          {/* ── Outstanding Balances')

    # 4. Outstanding Balances
    content = content.replace('<View className="px-6 mb-8">\n            <View className="flex-row items-center justify-between mb-4">', '<Animated.View entering={FadeInDown.delay(300).springify()} className="px-6 mb-8">\n            <View className="flex-row items-center justify-between mb-4">')
    content = content.replace('</View>\n              )}\n            </View>\n          </View>\n\n          {/* ── Recent Activity', '</View>\n              )}\n            </View>\n          </Animated.View>\n\n          {/* ── Recent Activity')

    # 5. Recent Activity
    content = content.replace('{recentActivities.length > 0 && (\n            <View className="px-6 mb-8">\n              <View className="flex-row items-center justify-between mb-4">', '{recentActivities.length > 0 && (\n            <Animated.View entering={FadeInDown.delay(400).springify()} className="px-6 mb-8">\n              <View className="flex-row items-center justify-between mb-4">')
    content = content.replace('/>\n                  ))}\n                </View>\n              </View>\n            </View>\n          )}', '/>\n                  ))}\n                </View>\n              </View>\n            </Animated.View>\n          )}')

    with open("src/app/(tabs)/index.tsx", "w") as f:
        f.write(content)


process_index()
print("Processed index")
